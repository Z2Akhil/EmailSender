import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { connectDB } from "@/lib/db";
import { Workspace } from "@/models/Workspace";
import { isSharedSendingEnabled, getSharedFromEmail, getSharedSuffix } from "@/lib/shared-sending";

export const dynamic = "force-dynamic";

/**
 * GET /api/settings/sending
 * Everything the campaign form's Settings step needs to offer
 * zero-setup "Simple mode" sending in a single fetch.
 */
export async function GET() {
    const { session, response } = await requireAuth();
    if (!session) return response;

    try {
        await connectDB();
        const workspace = await Workspace.findById(session.user.workspaceId).select("name");

        return NextResponse.json({
            success: true,
            data: {
                sharedEnabled: isSharedSendingEnabled(),
                sharedFromEmail: getSharedFromEmail(),
                sharedFromNameSuffix: getSharedSuffix(),
                defaultReplyTo: session.user.email || null,
                workspaceName: workspace?.name || null,
            },
        });
    } catch (error) {
        console.error("[SETTINGS_SENDING]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
