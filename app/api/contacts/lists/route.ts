import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { ContactList } from "@/models/Contact";
import { createListSchema } from "@/lib/validations/contact";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const workspaceId = session.user.workspaceId;
        if (!workspaceId) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 400 });
        }

        await connectDB();

        const lists = await ContactList.find({ workspaceId }).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: lists });
    } catch (error) {
        console.error("[CONTACT_LISTS_GET]", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const workspaceId = session.user.workspaceId;
        if (!workspaceId) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 400 });
        }

        const body = await req.json();
        const result = createListSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 }
            );
        }

        await connectDB();

        const newList = await ContactList.create({
            name: result.data.name,
            workspaceId,
        });

        return NextResponse.json({ success: true, data: newList }, { status: 201 });
    } catch (error) {
        console.error("[CONTACT_LISTS_POST]", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
