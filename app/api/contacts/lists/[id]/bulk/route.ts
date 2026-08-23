import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { connectDB } from "@/lib/db";
import { Contact, ContactList } from "@/models/Contact";
import { checkPlanLimits } from "@/lib/stripe";
import mongoose from "mongoose";
import { z } from "zod";
import { splitFullName } from "@/lib/contact-import";

const bulkSchema = z.object({
    contacts: z.array(z.object({
        email: z.string(),
        fullName: z.string().optional(),
    })).min(1).max(500),
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/contacts/lists/[id]/bulk
 * Fast path for the onboarding wizard's "paste emails" box: validates,
 * dedupes, respects the plan's contact limit, and inserts in one call.
 * Response: { inserted, duplicates, invalid, limited, contactCount }
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { session, response } = await requireAuth();
    if (!session) return response;

    try {
        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: "Invalid list id" }, { status: 400 });
        }

        const body = await req.json();
        const { contacts } = bulkSchema.parse(body);

        await connectDB();

        const list = await ContactList.findOne({ _id: id, workspaceId: session.user.workspaceId });
        if (!list) {
            return NextResponse.json({ success: false, error: "List not found" }, { status: 404 });
        }

        // Normalize + validate + dedupe within the payload
        const seen = new Set<string>();
        const candidates: { email: string; firstName?: string; lastName?: string }[] = [];
        let invalid = 0;
        for (const c of contacts) {
            const email = c.email.trim().toLowerCase();
            if (!EMAIL_RE.test(email)) { invalid++; continue; }
            if (seen.has(email)) continue;
            seen.add(email);
            candidates.push({ email, ...splitFullName(c.fullName) });
        }

        // Drop emails already in this list
        const existing = await Contact.find({
            listId: id,
            email: { $in: candidates.map(c => c.email) },
        }).select("email");
        const existingSet = new Set(existing.map(e => e.email));
        let toInsert = candidates.filter(c => !existingSet.has(c.email));
        const duplicates = candidates.length - toInsert.length;

        // Plan limit: clamp instead of rejecting the whole batch
        const limitCheck = await checkPlanLimits(session.user.workspaceId, "contacts");
        const remaining = Math.max(0, (limitCheck.limit ?? Infinity) - (limitCheck.current ?? 0));
        const limited = Math.max(0, toInsert.length - remaining);
        toInsert = toInsert.slice(0, remaining);

        let inserted = 0;
        if (toInsert.length > 0) {
            const docs = await Contact.insertMany(
                toInsert.map(c => ({
                    email: c.email,
                    firstName: c.firstName,
                    lastName: c.lastName,
                    listId: id,
                    workspaceId: session.user.workspaceId,
                    status: "ACTIVE",
                })),
                { ordered: false }
            );
            inserted = docs.length;
            await ContactList.findByIdAndUpdate(id, { $inc: { contactCount: inserted } });
        }

        return NextResponse.json({
            success: true,
            data: {
                inserted,
                duplicates,
                invalid,
                limited,
                contactCount: (list.contactCount || 0) + inserted,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
        }
        console.error("[CONTACTS_BULK]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
