import { Worker, Job } from "bullmq";
import { getRedisConnection } from "./redis";
import { connectDB } from "./db";
import { Campaign, CampaignRecipient } from "@/models/Campaign";
import { Contact } from "@/models/Contact";
import Domain from "@/models/Domain";
import { Workspace } from "@/models/Workspace";
import { Template } from "@/models/Template";
import { sendEmail, injectComplianceFooter } from "./email-service";
import { sendWhatsappMessage } from "./whatsapp-service";
import { decrypt } from "./crypto";
import mongoose from "mongoose";

export const initWorker = () => {
    const worker = new Worker(
        "email-queue",
        async (job: Job) => {
            const { campaignId, contactId, recipientEmail, recipientName } = job.data;

            try {
                await connectDB();

                // 1. Fetch Campaign Details
                const campaign = await Campaign.findById(campaignId);
                if (!campaign) {
                    throw new Error(`Campaign ${campaignId} not found`);
                }

                if (campaign.status === "CANCELLED") {
                    return { skipped: true, reason: "Campaign cancelled" };
                }

                // 2. Verify Domain Status (if applicable)
                if (campaign.domainId) {
                    const domain = await Domain.findById(campaign.domainId);
                    if (!domain || domain.verificationStatus !== "VERIFIED") {
                        throw new Error(`Sending domain ${domain?.domainName || campaign.domainId} is not verified`);
                    }
                }

                // 3. Sync/Create Recipient Status early to get ID
                const recipientStatus = await CampaignRecipient.findOneAndUpdate(
                    { campaignId, contactId },
                    {
                        email: recipientEmail,
                        status: "PENDING",
                        updatedAt: new Date()
                    },
                    { upsert: true, new: true }
                );

                const recipientId = recipientStatus._id.toString();

                // 4. Prepare Content (Simple Variable Replacement)
                let html = campaign.htmlContent;
                html = html.replace(/{{firstName}}/g, recipientName || "there");
                html = html.replace(/{{email}}/g, recipientEmail);

                // 5. Inject Open Tracking Pixel
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://scoreit.in";
                const openTrackingUrl = `${baseUrl}/api/track/open/${recipientId}`;
                html = html.replace("</body>", `<img src="${openTrackingUrl}" width="1" height="1" style="display:none;" /></body>`);
                if (!html.includes("</body>")) {
                    html += `<img src="${openTrackingUrl}" width="1" height="1" style="display:none;" />`;
                }

                // 6. Inject Click Tracking (Wrap all links)
                const clickTrackingBaseUrl = `${baseUrl}/api/track/click`;
                html = html.replace(/href="([^"]*)"/g, (match, url) => {
                    // Skip unsubscribe links (they have their own tracking logic usually, or should be direct)
                    if (url.includes("/unsubscribe")) {
                        return match;
                    }

                    const trackedUrl = `${clickTrackingBaseUrl}?r=${recipientId}&u=${encodeURIComponent(url)}`;
                    return match.replace(url, trackedUrl);
                });

                // 7. Inject Compliance Footer
                const unsubscribeUrl = `${baseUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}&cid=${campaignId}`;
                html = injectComplianceFooter(html, unsubscribeUrl);

                // 8. Fetch Workspace for SMTP settings
                const workspace = await Workspace.findById(campaign.workspaceId);

                let smtpConfig;
                // Route via SMTP if explicitly selected or if legacy campaign has no SES domain
                const useSmtp = campaign.provider === "SMTP" || (!campaign.provider && !campaign.domainId);
                if (useSmtp && workspace?.smtpHost && workspace?.smtpPass) {
                    try {
                        const decryptedPass = decrypt(workspace.smtpPass);
                        smtpConfig = {
                            host: workspace.smtpHost,
                            port: workspace.smtpPort || 587,
                            user: workspace.smtpUser || "",
                            pass: decryptedPass,
                            secure: workspace.smtpSecure ?? true,
                        };
                    } catch (err) {
                        console.error(`Failed to decrypt SMTP password for workspace ${campaign.workspaceId}:`, err);
                    }
                }

                // 9. Send Email
                const result = await sendEmail({
                    to: recipientEmail,
                    subject: campaign.subject,
                    html: html,
                    fromName: campaign.fromName,
                    fromEmail: campaign.fromEmail,
                    replyTo: campaign.replyTo,
                    smtpConfig,
                });

                // 10. Update Statuses
                await CampaignRecipient.findByIdAndUpdate(recipientId, {
                    status: "DELIVERED",
                    updatedAt: new Date()
                });

                const updatedCampaign = await Campaign.findByIdAndUpdate(campaignId, {
                    $inc: { sentCount: 1 }
                }, { new: true });

                if (updatedCampaign && (updatedCampaign.sentCount + updatedCampaign.failedCount >= updatedCampaign.totalRecipients)) {
                    await Campaign.findByIdAndUpdate(campaignId, { status: "SENT" });
                }

                return { success: true, messageId: result.messageId };
            } catch (error: any) {
                console.error(`Failed to process email job ${job.id}:`, error);

                // Update recipient status to failed
                await CampaignRecipient.findOneAndUpdate(
                    { campaignId, contactId },
                    {
                        status: "FAILED",
                        updatedAt: new Date()
                    },
                    { upsert: true }
                );

                const updatedCampaign = await Campaign.findByIdAndUpdate(campaignId, {
                    $inc: { failedCount: 1 }
                }, { new: true });

                if (updatedCampaign && (updatedCampaign.sentCount + updatedCampaign.failedCount >= updatedCampaign.totalRecipients)) {
                    await Campaign.findByIdAndUpdate(campaignId, { status: "SENT" });
                }

                throw error; // Let BullMQ handle retry
            }
        },
        {
            connection: getRedisConnection() as any,
            concurrency: 5, // Process 5 emails at a time
        }
    );

    worker.on("completed", (job) => {
        console.log(`Job ${job.id} completed successfully`);
    });

    worker.on("failed", (job, err) => {
        console.error(`Job ${job?.id} failed with error:`, err);
    });

    return worker;
};

export const initWhatsappWorker = () => {
    const worker = new Worker(
        "whatsapp-queue",
        async (job: Job) => {
            const { campaignId, contactId, recipientPhone, recipientName } = job.data;

            try {
                await connectDB();

                const campaign = await Campaign.findById(campaignId);
                if (!campaign) {
                    throw new Error(`Campaign ${campaignId} not found`);
                }

                if (campaign.status === "CANCELLED") {
                    return { skipped: true, reason: "Campaign cancelled" };
                }

                const workspace = await Workspace.findById(campaign.workspaceId);
                if (!workspace || !workspace.whatsappAccessToken || !workspace.whatsappPhoneNumberId) {
                    throw new Error(`WhatsApp not configured for Workspace ${campaign.workspaceId}`);
                }

                const template = await Template.findById(campaign.templateId);
                if (!template || template.type !== "WHATSAPP") {
                    throw new Error(`Valid WhatsApp template not found for Campaign ${campaignId}`);
                }

                const contact = await Contact.findById(contactId);
                if (!contact) {
                    throw new Error(`Contact ${contactId} not found`);
                }

                if (!contact.whatsappOptIn) {
                    await CampaignRecipient.findOneAndUpdate(
                        { campaignId, contactId },
                        {
                            email: recipientPhone,
                            status: "FAILED", // Marked as failed due to compliance
                            updatedAt: new Date()
                        },
                        { upsert: true }
                    );

                    const updatedCampaign = await Campaign.findByIdAndUpdate(campaignId, {
                        $inc: { failedCount: 1 }
                    }, { new: true });

                    if (updatedCampaign && (updatedCampaign.sentCount + updatedCampaign.failedCount >= updatedCampaign.totalRecipients)) {
                        await Campaign.findByIdAndUpdate(campaignId, { status: "SENT" });
                    }

                    return { skipped: true, reason: "Contact has not opted-in to receive WhatsApp messages" };
                }

                // Wait / Rate Limit Logic (BullMQ concurrency also helps)
                // Just use the API since it handles some bursts, Meta recommends ~80 msg/sec minimum tier
                // BullMQ Rate limiter below (10 jobs / second) ensures we stay well within Meta's limits.

                const recipientStatus = await CampaignRecipient.findOneAndUpdate(
                    { campaignId, contactId },
                    {
                        email: recipientPhone, // We reuse 'email' field or add 'phone' field, for now 'email' field in Recipient might store phone number if we reuse
                        status: "PENDING",
                        updatedAt: new Date()
                    },
                    { upsert: true, new: true }
                );

                const result = await sendWhatsappMessage({
                    to: recipientPhone,
                    templateName: template.whatsappTemplateName || "",
                    languageCode: template.whatsappTemplateLanguage || "en_US",
                    components: template.whatsappTemplateComponents,
                    accessToken: workspace.whatsappAccessToken,
                    phoneNumberId: workspace.whatsappPhoneNumberId
                });

                // The messageId from Meta can be mapped here to the CampaignRecipient if we add a field for it

                // Save the WAMID so the webhook can match delivery status updates
                const wamid = result.messages?.[0]?.id;
                await CampaignRecipient.findByIdAndUpdate(recipientStatus._id, {
                    status: "SENT", // Initially SENT until Webhook updates to DELIVERED/READ
                    ...(wamid ? { messageId: wamid } : {}),
                    updatedAt: new Date()
                });

                const updatedCampaign = await Campaign.findByIdAndUpdate(campaignId, {
                    $inc: { sentCount: 1 }
                }, { new: true });

                if (updatedCampaign && (updatedCampaign.sentCount + updatedCampaign.failedCount >= updatedCampaign.totalRecipients)) {
                    await Campaign.findByIdAndUpdate(campaignId, { status: "SENT" });
                }

                return { success: true, messageId: result.messages?.[0]?.id };

            } catch (error: any) {
                console.error(`Failed to process whatsapp job ${job.id}:`, error);

                await CampaignRecipient.findOneAndUpdate(
                    { campaignId, contactId },
                    {
                        status: "FAILED",
                        updatedAt: new Date()
                    },
                    { upsert: true }
                );

                const updatedCampaign = await Campaign.findByIdAndUpdate(campaignId, {
                    $inc: { failedCount: 1 }
                }, { new: true });

                if (updatedCampaign && (updatedCampaign.sentCount + updatedCampaign.failedCount >= updatedCampaign.totalRecipients)) {
                    await Campaign.findByIdAndUpdate(campaignId, { status: "SENT" });
                }

                throw error;
            }
        },
        {
            connection: getRedisConnection() as any,
            concurrency: 10, // Meta allows higher concurrency, 10 is safe for starters
            limiter: {
                max: 50, // Max 50 jobs
                duration: 1000 // per second
            }
        }
    );

    worker.on("completed", (job) => {
        console.log(`WhatsApp Job ${job.id} completed successfully`);
    });

    worker.on("failed", (job, err) => {
        console.error(`WhatsApp Job ${job?.id} failed with error:`, err);
    });

    return worker;
};

