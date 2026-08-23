import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/db";
import { CampaignRecipient, Campaign } from "@/models/Campaign";

/**
 * Meta delivers statuses out of order and retries the same event until it gets
 * a 200, so every update here must be idempotent and must never move a
 * recipient backwards. Each transition is a single conditional update whose
 * filter names the statuses it is allowed to advance from — if the update
 * matches nothing, the event is a duplicate or stale and no counter moves.
 *
 * Counter ownership: the worker owns `sentCount` (incremented once when the
 * Graph API accepts the message). This route must NOT re-count a send as it
 * progresses to delivered/read, or `sentCount + failedCount` overshoots
 * `totalRecipients` — the expression the worker uses to decide a campaign is
 * finished.
 */
const PRECEDING_STATUSES: Record<string, string[]> = {
    SENT: ["PENDING"],
    DELIVERED: ["PENDING", "SENT"],
    READ: ["PENDING", "SENT", "DELIVERED", "OPENED"],
};

/** Statuses that already counted towards the campaign's `sentCount`. */
const COUNTED_AS_SENT = ["SENT", "DELIVERED", "READ", "OPENED"];

async function applyStatusUpdate(messageId: string, metaStatus: string, timestamp: Date) {
    if (!messageId) return;

    if (metaStatus === "failed") {
        // Terminal, and reachable from any non-failed state. `findOneAndUpdate`
        // returns the pre-update document, so the previous status decides
        // whether a `sentCount` already spent on this recipient must be given
        // back.
        const previous = await CampaignRecipient.findOneAndUpdate(
            { messageId, status: { $ne: "FAILED" } },
            { $set: { status: "FAILED", bouncedAt: timestamp } }
        );
        if (!previous) return;

        const inc: Record<string, number> = { failedCount: 1 };
        if (COUNTED_AS_SENT.includes(previous.status)) inc.sentCount = -1;
        await Campaign.updateOne({ _id: previous.campaignId }, { $inc: inc });
        return;
    }

    const status =
        metaStatus === "sent" ? "SENT" :
            metaStatus === "delivered" ? "DELIVERED" :
                metaStatus === "read" ? "READ" : null;
    if (!status) return;

    const previous = await CampaignRecipient.findOneAndUpdate(
        { messageId, status: { $in: PRECEDING_STATUSES[status] } },
        { $set: { status, ...(status === "READ" ? { openedAt: timestamp } : {}) } }
    );
    // No match = duplicate delivery or an out-of-order event for a recipient
    // that has already moved past this state. Nothing to count.
    if (!previous) return;

    // A read is counted once, on the single transition into READ.
    if (status === "READ") {
        await Campaign.updateOne({ _id: previous.campaignId }, { $inc: { openCount: 1 } });
    }
}

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

        // When the app secret is configured, a valid signature is mandatory —
        // otherwise anyone could POST fake delivery/read statuses.
        const secret = process.env.WHATSAPP_APP_SECRET;
        if (secret) {
            if (!signature) {
                return NextResponse.json({ error: "Missing signature" }, { status: 401 });
            }

            const expectedSignature = `sha256=${crypto
                .createHmac("sha256", secret)
                .update(bodyContent, "utf-8")
                .digest("hex")}`;

            const sigBuf = Buffer.from(signature);
            const expBuf = Buffer.from(expectedSignature);
            if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
                console.warn("Invalid WhatsApp Webhook Signature");
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        }

        const body = JSON.parse(bodyContent);

        if (body.object === "whatsapp_business_account") {
            await connectDB();

            for (const entry of body.entry) {
                for (const change of entry.changes) {
                    if (change.value.statuses) {
                        for (const statusObj of change.value.statuses) {
                            await applyStatusUpdate(
                                statusObj.id,
                                statusObj.status, // 'sent' | 'delivered' | 'read' | 'failed'
                                new Date(parseInt(statusObj.timestamp) * 1000)
                            );
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
