import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Template } from "@/models/Template";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Fetch global templates and templates belonging to this workspace
        const templates = await Template.find({
            $or: [
                { isGlobal: true },
                { workspaceId: session.user.workspaceId }
            ]
        }).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: templates });
    } catch (error) {
        console.error("[TEMPLATES_GET]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
