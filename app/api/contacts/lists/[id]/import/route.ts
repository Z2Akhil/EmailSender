import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ContactList, Contact } from "@/models/Contact";
import mongoose from "mongoose";
import { checkPlanLimits } from "@/lib/stripe";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RawRow {
    [key: string]: string;
}

interface ColumnMapping {
    email: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    phone?: string;
}

// POST /api/contacts/lists/[id]/import
// Accepts multipart/form-data with:
//   - file: CSV or XLSX file
//   - mapping: JSON string of { email, firstName?, lastName?, company?, phone? } column names
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

        if (!file) {
            return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
        }
        if (!mappingStr) {
            return NextResponse.json({ success: false, error: "No column mapping provided" }, { status: 400 });
        }

        let mapping: ColumnMapping;
        try {
            mapping = JSON.parse(mappingStr);
        } catch {
            return NextResponse.json({ success: false, error: "Invalid column mapping JSON" }, { status: 400 });
        }

        if (!mapping.email) {
            return NextResponse.json({ success: false, error: "Email column mapping is required" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name.toLowerCase();

        let rows: RawRow[] = [];

        if (fileName.endsWith(".csv")) {
            // Parse CSV
            const { parse } = await import("csv-parse/sync");
            rows = parse(buffer, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            }) as RawRow[];
        } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
            // Parse Excel
            const XLSX = await import("xlsx");
            const workbook = XLSX.read(buffer, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: "" });
        } else {
            return NextResponse.json({ success: false, error: "Unsupported file type. Please upload a .csv or .xlsx file." }, { status: 400 });
        }

        if (rows.length === 0) {
            return NextResponse.json({ success: false, error: "File is empty or has no data rows" }, { status: 400 });
        }

        // Process rows
        const imported: string[] = [];
        const skipped: string[] = [];
        const errors: { row: number; email: string; reason: string }[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const rawEmail = row[mapping.email]?.toString().trim().toLowerCase() || "";

            if (!rawEmail) {
                errors.push({ row: i + 2, email: "(empty)", reason: "Missing email" });
                continue;
            }

            if (!EMAIL_REGEX.test(rawEmail)) {
                errors.push({ row: i + 2, email: rawEmail, reason: "Invalid email format" });
                continue;
            }

            // Check for duplicate in this list
            const existing = await Contact.findOne({ email: rawEmail, listId: id });
            if (existing) {
                skipped.push(rawEmail);
                continue;
            }

            try {
                // Check Plan Limits (In-loop to ensure we don't exceed)
                const limitCheck = await checkPlanLimits(session.user.workspaceId, "contacts");
                if (!limitCheck.allowed) {
                    errors.push({ row: i + 2, email: rawEmail, reason: `Plan limit reached (${limitCheck.limit} contacts). Please upgrade.` });
                    break; // Stop importing further rows
                }

                await Contact.create({
                    email: rawEmail,
                    firstName: mapping.firstName ? row[mapping.firstName]?.toString().trim() || undefined : undefined,
                    lastName: mapping.lastName ? row[mapping.lastName]?.toString().trim() || undefined : undefined,
                    company: mapping.company ? row[mapping.company]?.toString().trim() || undefined : undefined,
                    phone: mapping.phone ? row[mapping.phone]?.toString().trim() || undefined : undefined,
                    listId: id,
                    workspaceId: session.user.workspaceId,
                    status: "ACTIVE",
                });
                imported.push(rawEmail);
            } catch (err: unknown) {
                const mongoErr = err as { code?: number };
                if (mongoErr.code === 11000) {
                    // Duplicate key (race condition)
                    skipped.push(rawEmail);
                } else {
                    errors.push({ row: i + 2, email: rawEmail, reason: "Database error" });
                }
            }
        }

        // Update contactCount
        if (imported.length > 0) {
            await ContactList.findByIdAndUpdate(id, {
                $inc: { contactCount: imported.length },
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                imported: imported.length,
                skipped: skipped.length,
                errors: errors.length,
                errorDetails: errors.slice(0, 20), // Return first 20 errors
                total: rows.length,
            },
        });
    } catch (error) {
        console.error("Import contacts error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
