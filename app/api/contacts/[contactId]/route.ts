import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ContactList, Contact } from "@/models/Contact";
import mongoose from "mongoose";

// PATCH /api/contacts/[contactId]
// Body: { status: "ACTIVE" | "UNSUBSCRIBED" | "BOUNCED" }
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ contactId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { contactId } = await params;
        if (!mongoose.Types.ObjectId.isValid(contactId)) {
            return NextResponse.json({ success: false, error: "Invalid contact ID" }, { status: 400 });
        }

        await connectDB();

        const contact = await Contact.findById(contactId);
        if (!contact) {
            return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 });
        }

        // Verify the list belongs to this workspace
        const list = await ContactList.findOne({
            _id: contact.listId,
            workspaceId: session.user.workspaceId,
        });
        if (!list) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const { status } = body;

        if (!status || !["ACTIVE", "UNSUBSCRIBED", "BOUNCED"].includes(status)) {
            return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
        }

        contact.status = status;
        await contact.save();

        return NextResponse.json({
            success: true,
            data: {
                id: contact._id.toString(),
                status: contact.status,
            },
        });
    } catch (error) {
        console.error("PATCH contact error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

// DELETE /api/contacts/[contactId]
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ contactId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { contactId } = await params;
        if (!mongoose.Types.ObjectId.isValid(contactId)) {
            return NextResponse.json({ success: false, error: "Invalid contact ID" }, { status: 400 });
        }

        await connectDB();

        const contact = await Contact.findById(contactId);
        if (!contact) {
            return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 });
        }

        // Verify the list belongs to this workspace
        const list = await ContactList.findOne({
            _id: contact.listId,
            workspaceId: session.user.workspaceId,
        });
        if (!list) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
        }

        await Contact.findByIdAndDelete(contactId);

        // Decrement contactCount (don't go below 0)
        await ContactList.findByIdAndUpdate(contact.listId, {
            $inc: { contactCount: -1 },
        });

        return NextResponse.json({ success: true, message: "Contact deleted" });
    } catch (error) {
        console.error("DELETE contact error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
