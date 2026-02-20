import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Contact } from "@/models/Contact";
import { Campaign, CampaignRecipient } from "@/models/Campaign";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const campaignId = searchParams.get("cid");

    if (!email) {
        return new NextResponse("Invalid request: Email missing", { status: 400 });
    }

    try {
        await connectDB();

        // 1. Mark contact as UNSUBSCRIBED globally in our system
        // Note: For now we'll update all contacts with this email to UNSUBSCRIBED
        await Contact.updateMany(
            { email: email.toLowerCase() },
            { status: "UNSUBSCRIBED", updatedAt: new Date() }
        );

        // 2. Update the specific campaign recipient status if provided
        if (campaignId) {
            await CampaignRecipient.findOneAndUpdate(
                { campaignId, email: email.toLowerCase() },
                { status: "UNSUBSCRIBED" }
            );

            await Campaign.findByIdAndUpdate(campaignId, {
                $inc: { unsubscribeCount: 1 }
            });
        }

        // Return a simple HTML confirmation page
        return new NextResponse(`
            <html>
                <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <div style="max-width: 400px; margin: 0 auto; border: 1px solid #eee; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                        <h1 style="color: #1e293b;">Unsubscribed</h1>
                        <p style="color: #64748b;">You have been successfully removed from our mailing list.</p>
                        <p style="color: #94a3b8; font-size: 14px;">Email: ${email}</p>
                    </div>
                </body>
            </html>
        `, {
            headers: { "Content-Type": "text/html" }
        });
    } catch (error) {
        console.error("[UNSUBSCRIBE_GET]", error);
        return new NextResponse("An error occurred during unsubscription", { status: 500 });
    }
}
