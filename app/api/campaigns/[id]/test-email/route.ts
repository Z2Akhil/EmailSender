import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { sendEmail } from "@/lib/email-service";
import { isSharedSendingEnabled, composeSharedSender } from "@/lib/shared-sending";
import { z } from "zod";

const testEmailSchema = z.object({
    to: z.string().email("A valid recipient email is required"),
});

/**
 * POST /api/campaigns/[id]/test-email
 * Sends a preview of the campaign email to a specified address.
 * Does NOT count against plan limits and does NOT track opens/clicks.
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
        const { to } = testEmailSchema.parse(body);

        await connectDB();

        const campaign = await Campaign.findOne({
            _id: id,
            workspaceId: session.user.workspaceId,
        });

        if (!campaign) {
            return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
        }

        if (!campaign.htmlContent) {
            return NextResponse.json({ success: false, error: "Campaign has no HTML content" }, { status: 400 });
        }

        // Replace personalization tags with preview values
        let html = campaign.htmlContent;
        html = html.replace(/{{firstName}}/g, "Preview User");
        html = html.replace(/{{email}}/g, to);
        html = html.replace(/\{{{unsubscribeUrl}}}/g, "#");
        html = html.replace(/{{unsubscribeUrl}}/g, "#");

        // Prepend a test banner
        const testBanner = `
<div style="background:#fbbf24;color:#78350f;padding:10px 20px;text-align:center;font-family:sans-serif;font-size:13px;font-weight:600;">
  ⚠️ TEST EMAIL — This is a preview of your campaign. Tracking and unsubscribe links are disabled.
</div>`;
        html = testBanner + html;

        // Compose the shared sender exactly like the worker does, so the
        // test email matches what recipients will actually see
        let fromName = campaign.fromName;
        let fromEmail = campaign.fromEmail;
        let replyTo = campaign.replyTo;
        if (campaign.provider === "SHARED") {
            if (!isSharedSendingEnabled()) {
                return NextResponse.json(
                    { success: false, error: "Shared sending is not configured on this server." },
                    { status: 400 }
                );
            }
            ({ fromName, fromEmail } = composeSharedSender(campaign.fromName));
            replyTo = campaign.replyTo || session.user.email || undefined;
        }

        await sendEmail({
            to,
            subject: `[TEST] ${campaign.subject || campaign.name}`,
            html,
            fromName,
            fromEmail,
            replyTo,
        });

        return NextResponse.json({
            success: true,
            message: `Test email sent to ${to}`,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
        }
        console.error("[TEST_EMAIL]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
