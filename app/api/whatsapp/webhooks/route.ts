import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/db";
import { CampaignRecipient } from "@/models/Campaign";

// The secret token string used to verify Meta webhook setups
const VERIFY_TOKEN = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || "bulkmailer-whatsapp-webhook-secret";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);

    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("WhatsApp Webhook verified successfully");
        return new NextResponse(challenge, { status: 200 });
    }

    return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
    try {
        const payload = await req.text();
        const signature = req.headers.get("x-hub-signature-256");

        // Verify the signature if APP_SECRET is available
        const appSecret = process.env.WHATSAPP_APP_SECRET;
        if (signature && appSecret) {
            const expectedSignature = "sha256=" + crypto.createHmac("sha256", appSecret).update(payload, "utf8").digest("hex");
            if (signature !== expectedSignature) {
                console.error("Invalid WhatsApp Webhook Signature");
                return new NextResponse("Invalid Signature", { status: 403 });
            }
        }

        const body = JSON.parse(payload);

        // Check if this is a WhatsApp status update
        if (body.object === "whatsapp_business_account") {
            await connectDB();

            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    if (change.value.statuses) {
                        for (const status of change.value.statuses) {
                            const recipientId = status.id; // Usually the WAMID (WhatsApp Message ID)
                            const statusType = status.status; // 'sent', 'delivered', 'read', 'failed'
                            // Note: We need a mapping from WAMID to CampaignRecipient if we store WAMID 
                            // Since we might not have WAMID stored yet, we might need to store it when sending
                            // For now, assume we do, or we find by phone number (recipient_id).

                            // Let's map Meta statuses to our statuses
                            let internalStatus: string | null = null;
                            if (statusType === "sent") internalStatus = "SENT";
                            if (statusType === "delivered") internalStatus = "DELIVERED";
                            if (statusType === "read") internalStatus = "READ";
                            if (statusType === "failed") internalStatus = "FAILED";

                            if (internalStatus) {
                                console.log(`[WHATSAPP WEBHOOK] Status Update: ${change.value.metadata.display_phone_number} - ${internalStatus}`);

                                // Accurate update via messageId (WAMID)
                                await CampaignRecipient.findOneAndUpdate(
                                    { messageId: recipientId },
                                    { status: internalStatus, updatedAt: new Date() }
                                );
                            }
                        }
                    }
                }
            }
        }

        return NextResponse.json({ status: "ok" }, { status: 200 });

    } catch (error) {
        console.error("WhatsApp Webhook error:", error);
        // Meta expects a 200 OK back even on errors to stop retrying infinitely, unless it's a 500
        return NextResponse.json({ status: "error" }, { status: 500 });
    }
}
