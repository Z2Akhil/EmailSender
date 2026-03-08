import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { Campaign, CampaignRecipient } from "@/models/Campaign";
import { Contact } from "@/models/Contact";

/**
 * POST /api/track/bounce
 * Handles Amazon SES bounce and complaint notifications via AWS SNS.
 *
 * Setup steps:
 * 1. Create an SNS Topic in AWS (e.g. "bulkmailer-ses-notifications")
 * 2. In SES → Configuration Sets or verified identities → Notifications → 
 *    Select your SNS Topic for Bounces and Complaints
 * 3. Add an SNS Subscription: HTTP/HTTPS → https://your-domain.com/api/track/bounce
 * 4. Confirm the subscription (SNS will POST a SubscriptionConfirmation message here)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const messageType = req.headers.get("x-amz-sns-message-type");

        // ── Subscription Confirmation ────────────────────────────────────────
        // AWS SNS sends this when you first add the webhook subscription
        if (messageType === "SubscriptionConfirmation") {
            const confirmUrl = body.SubscribeURL;
            if (confirmUrl) {
                // Auto-confirm the subscription by fetching the URL
                await fetch(confirmUrl);
                console.log("[SNS] Subscription confirmed:", confirmUrl);
            }
            return NextResponse.json({ status: "confirmed" });
        }

        // ── Signature Verification (optional but recommended) ────────────────
        // In production, verify the SNS signature to prevent spoofing.
        // AWS provides SNS message signature verification libraries.
        // Skipping for now — add aws-sns-validator package for production.

        // ── Process Notification ─────────────────────────────────────────────
        if (messageType === "Notification") {
            await connectDB();

            let notification;
            try {
                notification = JSON.parse(body.Message);
            } catch {
                console.error("[SNS] Failed to parse message:", body.Message);
                return NextResponse.json({ status: "ignored" });
            }

            const notifType = notification.notificationType;

            // ── Handle Bounces ───────────────────────────────────────────────
            if (notifType === "Bounce") {
                const bounce = notification.bounce;
                const bouncedRecipients: string[] = bounce.bouncedRecipients?.map(
                    (r: any) => r.emailAddress?.toLowerCase()
                ) || [];

                for (const email of bouncedRecipients) {
                    if (!email) continue;

                    // Mark contact as BOUNCED in all lists for this workspace
                    await Contact.updateMany(
                        { email, status: "ACTIVE" },
                        { $set: { status: "BOUNCED" } }
                    );

                    // Update CampaignRecipient records
                    await CampaignRecipient.updateMany(
                        { email, status: { $nin: ["BOUNCED"] } },
                        { $set: { status: "BOUNCED", bouncedAt: new Date() } }
                    );

                    // Increment bounceCount on affected campaigns
                    const recipients = await CampaignRecipient.find({ email, status: "BOUNCED" });
                    for (const r of recipients) {
                        await Campaign.findByIdAndUpdate(r.campaignId, {
                            $inc: { bounceCount: 1 },
                        });
                    }

                    console.log(`[BOUNCE] Marked ${email} as BOUNCED`);
                }
            }

            // ── Handle Complaints (spam reports) ─────────────────────────────
            if (notifType === "Complaint") {
                const complaint = notification.complaint;
                const complainedRecipients: string[] = complaint.complainedRecipients?.map(
                    (r: any) => r.emailAddress?.toLowerCase()
                ) || [];

                for (const email of complainedRecipients) {
                    if (!email) continue;

                    // Treat complaint as unsubscribe
                    await Contact.updateMany(
                        { email, status: "ACTIVE" },
                        { $set: { status: "UNSUBSCRIBED" } }
                    );

                    await CampaignRecipient.updateMany(
                        { email },
                        { $set: { status: "UNSUBSCRIBED" } }
                    );

                    const recipients = await CampaignRecipient.find({ email });
                    for (const r of recipients) {
                        await Campaign.findByIdAndUpdate(r.campaignId, {
                            $inc: { unsubscribeCount: 1 },
                        });
                    }

                    console.log(`[COMPLAINT] Marked ${email} as UNSUBSCRIBED due to complaint`);
                }
            }
        }

        return NextResponse.json({ status: "ok" });
    } catch (error) {
        console.error("[BOUNCE_WEBHOOK]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
