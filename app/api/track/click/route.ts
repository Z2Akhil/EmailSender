import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Campaign, CampaignRecipient } from "@/models/Campaign";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const recipientId = searchParams.get("r");
        const targetUrl = searchParams.get("u");

        if (!targetUrl) {
            return NextResponse.redirect(new URL("/", req.url));
        }

        if (recipientId) {
            await connectDB();

            // 1. Find and update the recipient
            const recipient = await CampaignRecipient.findById(recipientId);

            if (recipient && recipient.status !== "CLICKED") {
                // 2. Update recipient status
                recipient.status = "CLICKED";
                if (!recipient.openedAt) recipient.openedAt = new Date(); // If they clicked, they must have opened
                recipient.clickedAt = new Date();
                await recipient.save();

                // 3. Increment campaign click count
                await Campaign.findByIdAndUpdate(recipient.campaignId, {
                    $inc: { clickCount: 1 }
                });
            }
        }

        // 4. Redirect to the original URL
        return NextResponse.redirect(new URL(targetUrl));
    } catch (error) {
        console.error("[TRACK_CLICK_ERROR]", error);
        // Fallback to home if something goes wrong
        return NextResponse.redirect(new URL("/", req.url));
    }
}
