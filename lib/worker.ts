import { Worker, Job } from "bullmq";
import { getRedisConnection } from "./redis";
import { connectDB } from "./db";
import { Campaign, CampaignRecipient } from "@/models/Campaign";
import Domain from "@/models/Domain";
import { sendEmail, injectComplianceFooter } from "./email-service";
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

                // 3. Prepare Content (Simple Variable Replacement)
                let html = campaign.htmlContent;
                html = html.replace(/{{firstName}}/g, recipientName || "there");
                html = html.replace(/{{email}}/g, recipientEmail);

                // 4. Inject Compliance Footer
                const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(recipientEmail)}&cid=${campaignId}`;
                html = injectComplianceFooter(html, unsubscribeUrl);

                // 5. Send Email
                const result = await sendEmail({
                    to: recipientEmail,
                    subject: campaign.subject,
                    html: html,
                    fromName: campaign.fromName,
                    fromEmail: campaign.fromEmail,
                    replyTo: campaign.replyTo,
                });

                // 6. Update Statuses
                await CampaignRecipient.findOneAndUpdate(
                    { campaignId, contactId },
                    {
                        status: "DELIVERED",
                        updatedAt: new Date()
                    },
                    { upsert: true }
                );

                await Campaign.findByIdAndUpdate(campaignId, {
                    $inc: { sentCount: 1 }
                });

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
