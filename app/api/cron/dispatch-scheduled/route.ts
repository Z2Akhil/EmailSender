import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Campaign, type ICampaign } from "@/models/Campaign";
import { Contact } from "@/models/Contact";
import { Template } from "@/models/Template";
import { Workspace } from "@/models/Workspace";
import { addEmailJob, addWhatsappJob } from "@/lib/queue";

/**
 * Reasons a WhatsApp campaign cannot be dispatched right now, or null when it
 * is good to go. Mirrors the checks in POST /api/campaigns/[id]/send.
 */
async function whatsappBlocker(campaign: ICampaign): Promise<string | null> {
    const workspace = await Workspace.findById(campaign.workspaceId)
        .select("whatsappAccessToken whatsappPhoneNumberId");
    if (!workspace?.whatsappAccessToken || !workspace?.whatsappPhoneNumberId) {
        return "WhatsApp is not connected for this workspace";
    }

    if (!campaign.templateId) return "campaign has no WhatsApp template selected";

    const template = await Template.findById(campaign.templateId)
        .select("type whatsappTemplateName");
    if (!template || template.type !== "WHATSAPP" || !template.whatsappTemplateName) {
        return "selected template is not a valid WhatsApp template";
    }

    return null;
}

/**
 * GET /api/cron/dispatch-scheduled
 * Finds SCHEDULED campaigns whose scheduledAt has passed and dispatches their jobs.
 * Call this every minute via Vercel Cron Jobs (vercel.json) or an external cron.
 *
 * Secure this with a shared secret header to prevent unauthorized calls:
 * Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: NextRequest) {
    // Protect the cron endpoint — fail closed if CRON_SECRET is not configured
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
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

        let skipped = 0;

        for (const campaign of dueCampaigns) {
            try {
                const isWhatsapp = campaign.channel === "WHATSAPP";

                // Same preflight the manual send route runs. Without it a
                // disconnected workspace or a stale template turns into N
                // individually-failing jobs and N FAILED recipients, with the
                // real cause visible only in worker logs.
                if (isWhatsapp) {
                    const blocker = await whatsappBlocker(campaign);
                    if (blocker) {
                        // Left SCHEDULED on purpose: the next run picks it up
                        // once the workspace reconnects, instead of burning the
                        // recipient list on a send that cannot work.
                        console.warn(`[CRON] Holding campaign ${campaign._id} (${campaign.name}): ${blocker}`);
                        skipped++;
                        continue;
                    }
                }

                const contacts = await Contact.find({
                    listId: campaign.recipientListId,
                    status: "ACTIVE",
                });

                // Contacts can be reachable on one channel only, so filter to
                // the channel this campaign actually sends on.
                const eligibleContacts = isWhatsapp
                    ? contacts.filter((c) => c.whatsappNumber && c.whatsappOptIn)
                    : contacts.filter((c) => c.email);

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
                            recipientEmail: contact.email!,
                            recipientName: contact.firstName,
                            recipientLastName: contact.lastName,
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
            // Still SCHEDULED, waiting on a fixable configuration problem.
            held: skipped,
        });
    } catch (error) {
        console.error("[CRON_DISPATCH_SCHEDULED]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
