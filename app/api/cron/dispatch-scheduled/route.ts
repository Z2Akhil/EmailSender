import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { Contact } from "@/models/Contact";
import { addEmailJob, addWhatsappJob } from "@/lib/queue";

/**
 * GET /api/cron/dispatch-scheduled
 * Finds SCHEDULED campaigns whose scheduledAt has passed and dispatches their jobs.
 * Call this every minute via Vercel Cron Jobs (vercel.json) or an external cron.
 *
 * Secure this with a shared secret header to prevent unauthorized calls:
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
    // Protect the cron endpoint
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();

        // Find campaigns due for dispatch
        const dueCampaigns = await Campaign.find({
            status: "SCHEDULED",
            scheduledAt: { $lte: new Date() },
        });

        if (dueCampaigns.length === 0) {
            return NextResponse.json({ dispatched: 0, message: "No campaigns due" });
        }

        let totalDispatched = 0;

        for (const campaign of dueCampaigns) {
            try {
                const isWhatsapp = campaign.channel === "WHATSAPP";

                const contacts = await Contact.find({
                    listId: campaign.recipientListId,
                    status: "ACTIVE",
                });

                let eligibleContacts = contacts;
                if (isWhatsapp) {
                    eligibleContacts = contacts.filter((c) => c.whatsappNumber && c.whatsappOptIn);
                }

                if (eligibleContacts.length === 0) {
                    // No eligible contacts — mark as SENT with 0 recipients
                    await Campaign.findByIdAndUpdate(campaign._id, {
                        status: "SENT",
                        sentAt: new Date(),
                        totalRecipients: 0,
                    });
                    continue;
                }

                // Mark as SENDING
                await Campaign.findByIdAndUpdate(campaign._id, {
                    status: "SENDING",
                    sentAt: new Date(),
                    totalRecipients: eligibleContacts.length,
                });

                // Dispatch jobs
                const jobPromises = eligibleContacts.map((contact) => {
                    if (isWhatsapp) {
                        return addWhatsappJob({
                            campaignId: campaign._id.toString(),
                            contactId: contact._id.toString(),
                            recipientPhone: contact.whatsappNumber!,
                            recipientName: contact.firstName,
                        });
                    } else {
                        return addEmailJob({
                            campaignId: campaign._id.toString(),
                            contactId: contact._id.toString(),
                            recipientEmail: contact.email,
                            recipientName: contact.firstName,
                        });
                    }
                });

                await Promise.all(jobPromises);
                totalDispatched += eligibleContacts.length;

                console.log(`[CRON] Dispatched ${eligibleContacts.length} jobs for campaign ${campaign._id} (${campaign.name})`);
            } catch (err) {
                console.error(`[CRON] Failed to dispatch campaign ${campaign._id}:`, err);
                // Don't stop processing other campaigns
            }
        }

        return NextResponse.json({
            dispatched: totalDispatched,
            campaignsProcessed: dueCampaigns.length,
        });
    } catch (error) {
        console.error("[CRON_DISPATCH_SCHEDULED]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
