import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Campaign, CampaignRecipient } from "@/models/Campaign";
import { verifyTrackingSignature } from "@/lib/crypto";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const recipientId = searchParams.get("r");
        const targetUrl = searchParams.get("u");
        const signature = searchParams.get("s");

        if (!targetUrl || !recipientId || !signature) {
            return NextResponse.redirect(new URL("/", req.url));
        }

        // Reject unsigned/tampered URLs — prevents use as an open redirect
        if (!verifyTrackingSignature(recipientId, targetUrl, signature)) {
            return NextResponse.redirect(new URL("/", req.url));
        }

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

        // 4. Redirect to the original URL
        return NextResponse.redirect(new URL(targetUrl));
    } catch (error) {
        console.error("[TRACK_CLICK_ERROR]", error);
        // Fallback to home if something goes wrong
        return NextResponse.redirect(new URL("/", req.url));
    }
}
