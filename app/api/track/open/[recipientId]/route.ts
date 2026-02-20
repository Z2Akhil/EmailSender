import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Campaign, CampaignRecipient } from "@/models/Campaign";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ recipientId: string }> }
) {
    try {
        const { recipientId } = await params;

        await connectDB();

        // 1. Find the recipient
        const recipient = await CampaignRecipient.findById(recipientId);

        if (recipient && recipient.status !== "OPENED" && recipient.status !== "CLICKED") {
            // 2. Update recipient status
            recipient.status = "OPENED";
            recipient.openedAt = new Date();
            await recipient.save();

            // 3. Increment campaign open count
            await Campaign.findByIdAndUpdate(recipient.campaignId, {
                $inc: { openCount: 1 }
            });
        }

        // 4. Return a 1x1 transparent pixel
        const pixel = Buffer.from(
            "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
            "base64"
        );

        return new NextResponse(pixel, {
            headers: {
                "Content-Type": "image/gif",
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            },
        });
    } catch (error) {
        console.error("[TRACK_OPEN_ERROR]", error);
        // Still return the pixel even if tracking fails
        const pixel = Buffer.from(
            "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
            "base64"
        );
        return new NextResponse(pixel, {
            headers: { "Content-Type": "image/gif" },
        });
    }
}
