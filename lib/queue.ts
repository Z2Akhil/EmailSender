import { Queue } from "bullmq";
import { getRedisConnection } from "./redis";

export const EMAIL_QUEUE_NAME = "email-queue";

let emailQueue: Queue;

export const getEmailQueue = () => {
    if (!emailQueue) {
        emailQueue = new Queue(EMAIL_QUEUE_NAME, {
            connection: getRedisConnection() as any,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: "exponential",
                    delay: 1000,
                },
                removeOnComplete: true,
            },
        });
    }
    return emailQueue;
};

export const addEmailJob = async (data: {
    campaignId: string;
    contactId: string;
    recipientEmail: string;
    recipientName?: string;
}) => {
    const queue = getEmailQueue();
    return queue.add(`send-email-${data.campaignId}-${data.contactId}`, data);
};
