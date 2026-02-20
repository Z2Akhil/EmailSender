import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Workspace } from "@/models/Workspace";
import { z } from "zod";

const workspaceSchema = z.object({
    name: z.string().min(1, "Workspace name is required").max(50),
});

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const workspace = await Workspace.findById(session.user.workspaceId).select("name planTier createdAt");

        if (!workspace) {
            return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: workspace });
    } catch (error) {
        console.error("[SETTINGS_WORKSPACE_GET]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validated = workspaceSchema.parse(body);

        await connectDB();
        const workspace = await Workspace.findByIdAndUpdate(
            session.user.workspaceId,
            { name: validated.name },
            { new: true }
        ).select("name planTier updatedAt");

        if (!workspace) {
            return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: workspace });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
        }
        console.error("[SETTINGS_WORKSPACE_PATCH]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
