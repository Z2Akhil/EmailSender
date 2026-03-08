import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";

/**
 * POST /api/campaigns/[id]/duplicate
 * Creates a copy of the given campaign as a new DRAFT.
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const original = await Campaign.findOne({
            _id: id,
            workspaceId: session.user.workspaceId,
        });

        if (!original) {
            return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
        }

        const duplicate = await Campaign.create({
            name: `Copy of ${original.name}`,
            subject: original.subject,
            htmlContent: original.htmlContent,
            textContent: original.textContent,
            fromName: original.fromName,
            fromEmail: original.fromEmail,
            replyTo: original.replyTo,
            channel: original.channel,
            provider: original.provider,
            domainId: original.domainId,
            templateId: original.templateId,
            recipientListId: original.recipientListId,
            workspaceId: original.workspaceId,
            status: "DRAFT",
            // Analytics reset to 0 for new campaign
            totalRecipients: 0,
            sentCount: 0,
            openCount: 0,
            clickCount: 0,
            bounceCount: 0,
            unsubscribeCount: 0,
            failedCount: 0,
        });

        return NextResponse.json({
            success: true,
            data: duplicate,
            message: `Campaign duplicated as "${duplicate.name}"`,
        });
    } catch (error) {
        console.error("[CAMPAIGN_DUPLICATE]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
