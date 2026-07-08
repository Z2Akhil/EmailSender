import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { isSharedSendingEnabled } from "@/lib/shared-sending";
import { z } from "zod";

const scheduleSchema = z.object({
    scheduledAt: z.string().datetime({ message: "scheduledAt must be a valid ISO datetime string" }),
});

/**
 * POST /api/campaigns/[id]/schedule
 * Sets a campaign's status to SCHEDULED with a future sendAt time.
 * A cron job (GET /api/cron/dispatch-scheduled) will pick it up when the time arrives.
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

        const body = await req.json();
        const { scheduledAt } = scheduleSchema.parse(body);

        const scheduledDate = new Date(scheduledAt);
        if (scheduledDate <= new Date()) {
            return NextResponse.json({ success: false, error: "scheduledAt must be in the future" }, { status: 400 });
        }

        await connectDB();

        const campaign = await Campaign.findOne({
            _id: id,
            workspaceId: session.user.workspaceId,
        });

        if (!campaign) {
            return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
        }

        if (campaign.status !== "DRAFT") {
            return NextResponse.json({
                success: false,
                error: `Cannot schedule a campaign with status "${campaign.status}". Only DRAFT campaigns can be scheduled.`,
            }, { status: 400 });
        }

        if (!campaign.recipientListId) {
            return NextResponse.json({ success: false, error: "Recipient list not selected" }, { status: 400 });
        }

        // Fail fast at schedule time — not when the cron fires
        if (campaign.provider === "SHARED") {
            if (!isSharedSendingEnabled()) {
                return NextResponse.json({
                    success: false,
                    error: "Shared sending is not configured on this server.",
                }, { status: 400 });
            }
            if (!campaign.replyTo) {
                return NextResponse.json({
                    success: false,
                    error: "Shared campaigns require a reply-to email so recipients can reach you.",
                }, { status: 400 });
            }
        }

        campaign.status = "SCHEDULED";
        campaign.scheduledAt = scheduledDate;
        await campaign.save();

        return NextResponse.json({
            success: true,
            message: `Campaign scheduled for ${scheduledDate.toISOString()}`,
            scheduledAt: scheduledDate,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
        }
        console.error("[CAMPAIGN_SCHEDULE]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

/**
 * DELETE /api/campaigns/[id]/schedule
 * Cancels a scheduled campaign and reverts it back to DRAFT.
 */
export async function DELETE(
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

        const campaign = await Campaign.findOneAndUpdate(
            { _id: id, workspaceId: session.user.workspaceId, status: "SCHEDULED" },
            { $set: { status: "DRAFT" }, $unset: { scheduledAt: "" } },
            { new: true }
        );

        if (!campaign) {
            return NextResponse.json({
                success: false,
                error: "Scheduled campaign not found or it is not in SCHEDULED status",
            }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Campaign schedule cancelled. Reverted to DRAFT." });
    } catch (error) {
        console.error("[CAMPAIGN_UNSCHEDULE]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
