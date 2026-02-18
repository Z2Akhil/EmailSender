import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { ContactList, Contact } from "@/models/Contact";
import { updateListSchema } from "@/lib/validations/contact";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const workspaceId = session.user.workspaceId;
        const body = await req.json();
        const result = updateListSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 }
            );
        }

        await connectDB();

        const list = await ContactList.findOneAndUpdate(
            { _id: id, workspaceId },
            { name: result.data.name },
            { new: true }
        );

        if (!list) {
            return NextResponse.json({ error: "List not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: list });
    } catch (error) {
        console.error("[CONTACT_LIST_PATCH]", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const workspaceId = session.user.workspaceId;

        await connectDB();

        const list = await ContactList.findOneAndDelete({ _id: id, workspaceId });

        if (!list) {
            return NextResponse.json({ error: "List not found" }, { status: 404 });
        }

        // Delete all contacts in this list
        await Contact.deleteMany({ listId: id });

        return NextResponse.json({ success: true, message: "List deleted" });
    } catch (error) {
        console.error("[CONTACT_LIST_DELETE]", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
