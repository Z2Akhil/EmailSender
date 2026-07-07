import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ContactList, Contact } from "@/models/Contact";
import mongoose from "mongoose";
import { checkPlanLimits } from "@/lib/stripe";

// GET /api/contacts/lists/[id]/contacts
// Query params: page, limit, search, status
export async function GET(
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

        // Verify the list belongs to this workspace
        const list = await ContactList.findOne({
            _id: id,
            workspaceId: session.user.workspaceId,
        });
        if (!list) {
            return NextResponse.json({ success: false, error: "List not found" }, { status: 404 });
        }

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
        const search = searchParams.get("search") || "";
        const status = searchParams.get("status") || "";

        const filter: Record<string, unknown> = { listId: id };
        if (status && ["ACTIVE", "UNSUBSCRIBED", "BOUNCED"].includes(status)) {
            filter.status = status;
        }
        if (search) {
            filter.$or = [
                { email: { $regex: search, $options: "i" } },
                { firstName: { $regex: search, $options: "i" } },
                { lastName: { $regex: search, $options: "i" } },
                { company: { $regex: search, $options: "i" } },
            ];
        }

        const total = await Contact.countDocuments(filter);
        const contacts = await Contact.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const formatted = contacts.map((c) => ({
            id: c._id.toString(),
            email: c.email,
            firstName: c.firstName ?? null,
            lastName: c.lastName ?? null,
            company: c.company ?? null,
            phone: c.phone ?? null,
            whatsappNumber: c.whatsappNumber ?? null,
            listId: c.listId.toString(),
            status: c.status,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        }));

        return NextResponse.json({
            success: true,
            data: formatted,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                listName: list.name,
            },
        });
    } catch (error) {
        console.error("GET contacts error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// POST /api/contacts/lists/[id]/contacts
// Body: { email, firstName?, lastName?, company?, phone?, whatsappNumber? }
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

        const body = await req.json();
        const { email, firstName, lastName, company, phone, whatsappNumber } = body;

        if (!email || typeof email !== "string") {
            return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 });
        }

        // Check for duplicate
        const existing = await Contact.findOne({ email: email.trim().toLowerCase(), listId: id });
        if (existing) {
            return NextResponse.json({ success: false, error: "Contact with this email already exists in this list" }, { status: 409 });
        }

        // Check Plan Limits
        const limitCheck = await checkPlanLimits(session.user.workspaceId, "contacts");
        if (!limitCheck.allowed) {
            return NextResponse.json({
                success: false,
                error: `Plan limit reached. You have ${limitCheck.current} contacts and your limit is ${limitCheck.limit}. Please upgrade your plan.`,
                code: "LIMIT_REACHED"
            }, { status: 403 });
        }

        const sanitizedWhatsapp = whatsappNumber?.replace(/[^0-9]/g, "") || undefined;

        const contact = await Contact.create({
            email: email.trim().toLowerCase(),
            firstName: firstName?.trim() || undefined,
            lastName: lastName?.trim() || undefined,
            company: company?.trim() || undefined,
            phone: phone?.trim() || undefined,
            whatsappNumber: sanitizedWhatsapp,
            // Providing a WhatsApp number implies the list owner asserts the
            // contact consented — without this flag every send skips them
            whatsappOptIn: !!sanitizedWhatsapp,
            listId: id,
            workspaceId: session.user.workspaceId,
            status: "ACTIVE",
        });

        // Increment contactCount
        await ContactList.findByIdAndUpdate(id, { $inc: { contactCount: 1 } });

        return NextResponse.json({
            success: true,
            data: {
                id: contact._id.toString(),
                email: contact.email,
                firstName: contact.firstName ?? null,
                lastName: contact.lastName ?? null,
                company: contact.company ?? null,
                phone: contact.phone ?? null,
                whatsappNumber: contact.whatsappNumber ?? null,
                listId: contact.listId.toString(),
                status: contact.status,
                createdAt: contact.createdAt,
                updatedAt: contact.updatedAt,
            },
        }, { status: 201 });
    } catch (error) {
        console.error("POST contact error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
