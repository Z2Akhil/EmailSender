import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ContactList, Contact } from "@/models/Contact";
import mongoose from "mongoose";
import { checkPlanLimits } from "@/lib/stripe";
import type { CountryCode } from "libphonenumber-js";
import {
    autoMapColumns,
    contactKey,
    isEmailReady,
    isWhatsappReady,
    normalizeMapping,
    normalizeRow,
    type ColumnMapping,
    type LegacyColumnMapping,
    type NormalizedContact,
} from "@/lib/contact-import";

type RawRow = Record<string, unknown>;

interface RowError {
    row: number;
    identifier: string;
    reason: string;
}

// POST /api/contacts/lists/[id]/import
//
// multipart/form-data:
//   file            CSV / XLSX / XLS / ODS / TSV               (required)
//   mapping         JSON { <canonicalField>: <column header> } (optional — headers are auto-mapped when omitted)
//                   canonical fields: fullName, email, phone, whatsappNumber
//   defaultCountry  ISO-3166 alpha-2, e.g. "IN"                (optional — resolves numbers with no country code)
//   whatsappOptIn   "true" | "false", default true             (consent for every number in the file)
//   updateExisting  "true" | "false", default false            (enrich matching contacts instead of skipping them)
//
// Rows are importable with an email, a WhatsApp number, or both, so one file
// serves email campaigns and WhatsApp campaigns alike.
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: "Invalid list ID" }, { status: 400 });
        }

        await connectDB();

        const list = await ContactList.findOne({
            _id: id,
            workspaceId: session.user.workspaceId,
        });
        if (!list) {
            return NextResponse.json({ success: false, error: "List not found" }, { status: 404 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const mappingStr = formData.get("mapping") as string | null;
        const defaultCountry = (formData.get("defaultCountry") as string | null)?.toUpperCase() || undefined;
        const whatsappOptInDefault = (formData.get("whatsappOptIn") as string | null) !== "false";
        const updateExisting = (formData.get("updateExisting") as string | null) === "true";

        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
        }

        // ─── Parse the file ───────────────────────────────────────────────────
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name.toLowerCase();
        let rows: RawRow[] = [];

        if (fileName.endsWith(".csv")) {
            const { parse } = await import("csv-parse/sync");
            rows = parse(buffer, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
                bom: true,
                relax_column_count: true,
            }) as RawRow[];
        } else if ([".xlsx", ".xls", ".ods", ".tsv"].some((ext) => fileName.endsWith(ext))) {
            // SheetJS handles Excel, OpenDocument and TSV alike. `raw: false`
            // keeps long phone numbers from arriving as floats.
            const XLSX = await import("xlsx");
            const workbook = XLSX.read(buffer, { type: "buffer" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "", raw: false });
        } else {
            return NextResponse.json({ success: false, error: "Unsupported file type. Please upload a .csv, .xlsx, .xls, .ods or .tsv file." }, { status: 400 });
        }

        if (rows.length === 0) {
            return NextResponse.json({ success: false, error: "File is empty or has no data rows" }, { status: 400 });
        }

        // ─── Resolve the column mapping ───────────────────────────────────────
        const headers = Object.keys(rows[0]);
        let mapping: ColumnMapping;
        if (mappingStr) {
            let parsed: LegacyColumnMapping;
            try {
                parsed = JSON.parse(mappingStr);
            } catch {
                return NextResponse.json({ success: false, error: "Invalid column mapping JSON" }, { status: 400 });
            }
            // Drop empty selections ("(skip)") so they don't read blank cells.
            for (const key of Object.keys(parsed) as (keyof LegacyColumnMapping)[]) {
                if (!parsed[key]) delete parsed[key];
            }
            mapping = normalizeMapping(parsed);
        } else {
            mapping = autoMapColumns(headers);
        }

        if (!mapping.email && !mapping.whatsappNumber) {
            return NextResponse.json({
                success: false,
                error: "Map at least one sending channel — an Email column, a WhatsApp number column, or both.",
            }, { status: 400 });
        }

        // ─── Normalize every row, deduping within the file ────────────────────
        const errors: RowError[] = [];
        const candidates: NormalizedContact[] = [];
        const seen = new Set<string>();
        let duplicatesInFile = 0;

        for (let i = 0; i < rows.length; i++) {
            const rowNumber = i + 2; // 1-based, +1 for the header row
            const { contact, error } = normalizeRow(rows[i], mapping, {
                defaultCountry: defaultCountry as CountryCode | undefined,
                whatsappOptInDefault,
            });

            if (!contact) {
                errors.push({ row: rowNumber, identifier: identify(rows[i], mapping), reason: error || "Invalid row" });
                continue;
            }

            const key = contactKey(contact);
            if (seen.has(key)) {
                duplicatesInFile++;
                continue;
            }
            seen.add(key);
            candidates.push(contact);
        }

        if (candidates.length === 0) {
            return NextResponse.json({
                success: true,
                data: emptyResult(rows.length, duplicatesInFile, errors),
            });
        }

        // ─── Match against contacts already in this list (2 queries, not 2×N) ──
        const emails = candidates.map((c) => c.email).filter(Boolean) as string[];
        const numbers = candidates.map((c) => c.whatsappNumber).filter(Boolean) as string[];

        const existing = await Contact.find({
            listId: id,
            $or: [
                ...(emails.length ? [{ email: { $in: emails } }] : []),
                ...(numbers.length ? [{ whatsappNumber: { $in: numbers } }] : []),
            ],
        })
            .select("_id email whatsappNumber")
            .lean();

        const existingByEmail = new Map<string, mongoose.Types.ObjectId>();
        const existingByNumber = new Map<string, mongoose.Types.ObjectId>();
        for (const c of existing) {
            if (c.email) existingByEmail.set(c.email, c._id);
            if (c.whatsappNumber) existingByNumber.set(c.whatsappNumber, c._id);
        }

        const toInsert: NormalizedContact[] = [];
        const toUpdate: { id: mongoose.Types.ObjectId; contact: NormalizedContact }[] = [];

        for (const contact of candidates) {
            const match =
                (contact.email && existingByEmail.get(contact.email)) ||
                (contact.whatsappNumber && existingByNumber.get(contact.whatsappNumber));
            if (match) {
                if (updateExisting) toUpdate.push({ id: match, contact });
                continue;
            }
            toInsert.push(contact);
        }

        // ─── Plan limit: one check, then trim to the remaining headroom ───────
        let limitReached = false;
        if (toInsert.length > 0) {
            const limitCheck = await checkPlanLimits(session.user.workspaceId, "contacts");
            const limit = limitCheck.limit ?? Number.POSITIVE_INFINITY;
            const headroom = Math.max(0, limit - (limitCheck.current ?? 0));

            if (toInsert.length > headroom) {
                limitReached = true;
                const rejected = toInsert.splice(headroom);
                for (const contact of rejected) {
                    errors.push({
                        row: 0,
                        identifier: contact.email || contact.whatsappNumber || "(unknown)",
                        reason: `Plan limit reached (${limit} contacts) — upgrade to import the rest`,
                    });
                }
            }
        }

        // ─── Write ────────────────────────────────────────────────────────────
        let imported = 0;
        if (toInsert.length > 0) {
            const docs = toInsert.map((c) => ({
                ...c,
                listId: new mongoose.Types.ObjectId(id),
                workspaceId: new mongoose.Types.ObjectId(session.user.workspaceId),
                status: "ACTIVE" as const,
            }));

            try {
                const inserted = await Contact.insertMany(docs, { ordered: false, rawResult: true });
                imported = inserted.insertedCount ?? Object.keys(inserted.insertedIds ?? {}).length;
            } catch (err: unknown) {
                // ordered:false keeps going past duplicates raced in by a
                // concurrent import; the good rows are still written.
                const bulkErr = err as { insertedDocs?: unknown[]; result?: { nInserted?: number }; writeErrors?: unknown[] };
                imported = bulkErr.result?.nInserted ?? bulkErr.insertedDocs?.length ?? 0;
                const failed = toInsert.length - imported;
                if (failed > 0) {
                    errors.push({ row: 0, identifier: `${failed} contact(s)`, reason: "Already existed or failed validation" });
                }
            }
        }

        let updated = 0;
        if (toUpdate.length > 0) {
            // $set only the fields the file actually carried, so an import that
            // enriches WhatsApp numbers never blanks an existing email or name.
            const ops = toUpdate.map(({ id: contactId, contact }) => ({
                updateOne: {
                    filter: { _id: contactId, workspaceId: new mongoose.Types.ObjectId(session.user.workspaceId) },
                    update: { $set: definedFields(contact) },
                },
            }));
            const res = await Contact.bulkWrite(ops, { ordered: false });
            updated = res.modifiedCount ?? 0;
        }

        if (imported > 0) {
            await ContactList.findByIdAndUpdate(id, { $inc: { contactCount: imported } });
        }

        // Channel readiness of everything the file resolved to — lets the UI say
        // "480 ready for email, 310 ready for WhatsApp" before a campaign is built.
        const touched = [...toInsert, ...toUpdate.map((u) => u.contact)];

        return NextResponse.json({
            success: true,
            data: {
                total: rows.length,
                imported,
                updated,
                skipped: (updateExisting ? 0 : candidates.length - toInsert.length) + duplicatesInFile,
                duplicatesInFile,
                errors: errors.length,
                errorDetails: errors.slice(0, 20),
                emailReady: touched.filter(isEmailReady).length,
                whatsappReady: touched.filter(isWhatsappReady).length,
                limitReached,
                mapping,
            },
        });
    } catch (error) {
        console.error("Import contacts error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

/** Best label for an unusable row, for the error table. */
function identify(row: RawRow, mapping: ColumnMapping): string {
    for (const field of ["email", "whatsappNumber", "phone", "fullName"] as const) {
        const column = mapping[field];
        const value = column ? row[column] : undefined;
        if (value != null && String(value).trim()) return String(value).trim();
    }
    return "(empty)";
}

function definedFields(contact: NormalizedContact): Record<string, unknown> {
    return Object.fromEntries(
        Object.entries(contact).filter(([, value]) => value !== undefined && value !== "")
    );
}

function emptyResult(total: number, duplicatesInFile: number, errors: RowError[]) {
    return {
        total,
        imported: 0,
        updated: 0,
        skipped: duplicatesInFile,
        duplicatesInFile,
        errors: errors.length,
        errorDetails: errors.slice(0, 20),
        emailReady: 0,
        whatsappReady: 0,
        limitReached: false,
    };
}
