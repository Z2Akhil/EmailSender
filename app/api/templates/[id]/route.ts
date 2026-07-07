import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Template } from "@/models/Template";

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

        await connectDB();

        const template = await Template.findOne({
            _id: id,
            $or: [
                { isGlobal: true },
                { workspaceId: session.user.workspaceId }
            ]
        });

        if (!template) {
            return NextResponse.json({ success: false, error: "Template not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: template });
    } catch (error) {
        console.error("[TEMPLATE_GET]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;

        await connectDB();

        // Only workspace-owned templates can be deleted — never global ones
        const template = await Template.findOneAndDelete({
            _id: id,
            workspaceId: session.user.workspaceId,
            isGlobal: false,
        });

        if (!template) {
            return NextResponse.json({ success: false, error: "Template not found or cannot be deleted" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Template deleted" });
    } catch (error) {
        console.error("[TEMPLATE_DELETE]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
