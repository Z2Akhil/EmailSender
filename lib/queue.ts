import { Queue } from "bullmq";
import { getRedisConnection } from "./redis";

export const EMAIL_QUEUE_NAME = "email-queue";
export const WHATSAPP_QUEUE_NAME = "whatsapp-queue";

let emailQueue: Queue;
let whatsappQueue: Queue;

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
    /** First name — kept as `recipientName` for in-flight jobs from older deploys. */
    recipientName?: string;
    recipientLastName?: string;
}) => {
    const queue = getEmailQueue();
    return queue.add(`send-email-${data.campaignId}-${data.contactId}`, data);
};

export const getWhatsappQueue = () => {
    if (!whatsappQueue) {
        whatsappQueue = new Queue(WHATSAPP_QUEUE_NAME, {
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
    return whatsappQueue;
};

export const addWhatsappJob = async (data: {
    campaignId: string;
    contactId: string;
    recipientPhone: string;
    recipientName?: string;
}) => {
    const queue = getWhatsappQueue();
    return queue.add(`send-whatsapp-${data.campaignId}-${data.contactId}`, data);
};
