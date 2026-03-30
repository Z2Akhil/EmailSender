import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/db";
import { CampaignRecipient, Campaign } from "@/models/Campaign";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        console.log("WhatsApp Webhook Verified!");
        return new NextResponse(challenge, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid verify token" }, { status: 403 });
}

export async function POST(req: NextRequest) {
    try {
        const signature = req.headers.get("x-hub-signature-256");
        const bodyContent = await req.text();

        if (signature) {
            const secret = process.env.WHATSAPP_APP_SECRET;
            if (secret) {
                const expectedSignature = `sha256=${crypto
                    .createHmac("sha256", secret)
                    .update(bodyContent, "utf-8")
                    .digest("hex")}`;
                
                if (signature !== expectedSignature) {
                    console.warn("Invalid WhatsApp Webhook Signature");
                    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
                }
            }
        }

        const body = JSON.parse(bodyContent);

        if (body.object === "whatsapp_business_account") {
            await connectDB();

            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    if (change.value.statuses) {
                        for (const statusObj of change.value.statuses) {
                            const messageId = statusObj.id;
                            const status = statusObj.status; // 'sent', 'delivered', 'read', 'failed'
                            const timestamp = new Date(parseInt(statusObj.timestamp) * 1000);

                            const recipient = await CampaignRecipient.findOne({ messageId });

                            if (recipient) {
                                const updateData: any = {};
                                
                                // Map Meta statuses to our DB statuses
                                if (status === "sent") {
                                    updateData.status = "SENT";
                                } else if (status === "delivered") {
                                    updateData.status = "DELIVERED";
                                } else if (status === "read") {
                                    updateData.status = "READ";
                                    updateData.openedAt = timestamp;
                                } else if (status === "failed") {
                                    updateData.status = "FAILED";
                                    updateData.bouncedAt = timestamp;
                                }

                                if (Object.keys(updateData).length > 0) {
                                    await CampaignRecipient.updateOne(
                                        { _id: recipient._id },
                                        { $set: updateData }
                                    );

                                    // Update Campaign Aggregate Counts
                                    const incData: any = {};
                                    if (status === "delivered") incData.sentCount = 1; // Delivered means successfully reached device
                                    else if (status === "read") incData.openCount = 1;
                                    else if (status === "failed") incData.failedCount = 1;
                                    
                                    if (Object.keys(incData).length > 0) {
                                        await Campaign.updateOne(
                                            { _id: recipient.campaignId },
                                            { $inc: incData }
                                        );
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return NextResponse.json({ success: true }, { status: 200 });
        }

        return NextResponse.json({ error: "Event not supported" }, { status: 404 });

    } catch (error) {
        console.error("WhatsApp Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
