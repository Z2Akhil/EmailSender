import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ContactList, Contact } from "@/models/Contact";
import mongoose from "mongoose";
import { joinFullName } from "@/lib/contact-import";

// GET /api/contacts/lists/[id]/export
// Returns a CSV file download
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

        const list = await ContactList.findOne({
            _id: id,
            workspaceId: session.user.workspaceId,
        });
        if (!list) {
            return NextResponse.json({ success: false, error: "List not found" }, { status: 404 });
        }

        const contacts = await Contact.find({ listId: id }).sort({ createdAt: -1 }).lean();

        // Build CSV — same four columns the importer accepts, so an export can
        // be re-imported as-is.
        const headers = ["name", "email", "phone", "whatsapp", "status", "createdAt"];
        const rows = contacts.map((c) => [
            joinFullName(c),
            c.email ?? "",
            c.phone ?? "",
            c.whatsappNumber ?? "",
            c.status,
            new Date(c.createdAt).toISOString(),
        ]);

        const csvLines = [
            headers.join(","),
            ...rows.map((row) =>
                row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")
            ),
        ];
        const csv = csvLines.join("\n");

        const filename = `${list.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_contacts.csv`;

        return new NextResponse(csv, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error("Export contacts error:", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
