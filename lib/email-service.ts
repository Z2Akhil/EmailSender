import sgMail from "@sendgrid/mail";
import {
    SESClient,
    VerifyDomainIdentityCommand,
    GetIdentityVerificationAttributesCommand,
    VerifyDomainDkimCommand,
    GetIdentityDkimAttributesCommand
} from "@aws-sdk/client-ses";
import nodemailer from "nodemailer";

if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");
}

const sesClient = new SESClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
});

export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    fromName?: string;
    fromEmail?: string;
    replyTo?: string;
    smtpConfig?: {
        host: string;
        port: number;
        user: string;
        pass: string;
        secure: boolean;
    };
}

export const sendEmail = async ({
    to,
    subject,
    html,
    fromName,
    fromEmail,
    replyTo,
    smtpConfig
}: SendEmailOptions) => {
    const from = {
        name: fromName || "BulkMailer",
        email: fromEmail || process.env.FROM_EMAIL || "hello@bulkmailer.com",
    };

    const msg = {
        to,
        from,
        subject,
        html,
        replyTo: replyTo || from.email,
    };

    try {
        // 1. Prefer Custom SMTP if provided
        if (smtpConfig) {
            const transporter = nodemailer.createTransport({
                host: smtpConfig.host,
                port: smtpConfig.port,
                secure: smtpConfig.secure,
                auth: {
                    user: smtpConfig.user,
                    pass: smtpConfig.pass,
                },
            });

            const info = await transporter.sendMail({
                from: fromName ? `"${fromName}" <${from.email}>` : from.email,
                to,
                subject,
                html,
                replyTo: replyTo || from.email,
            });

            return {
                success: true,
                messageId: info.messageId,
            };
        }

        // 2. Fallback to SES if configured
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
            // Note: Simple SendEmail for now. Real bulk might need SendRawEmail or batches.
            // For now implementing via SES SendEmail or similar.
            // SES requires verified identities (email or domain).
            const { SendEmailCommand } = await import("@aws-sdk/client-ses");
            const command = new SendEmailCommand({
                Destination: { ToAddresses: [to] },
                Message: {
                    Body: { Html: { Data: html } },
                    Subject: { Data: subject },
                },
                Source: fromName ? `"${fromName}" <${from.email}>` : from.email,
                ReplyToAddresses: [replyTo || from.email],
            });

            const response = await sesClient.send(command);
            return {
                success: true,
                messageId: response.MessageId,
            };
        }

        // Fallback to SendGrid
        if (!process.env.SENDGRID_API_KEY) {
            console.warn("No email provider configured (SES or SendGrid). Skipping email send (Log only).");
            console.log(`Email to ${to}: ${subject}`);
            return { success: true, messageId: "debug-id" };
        }

        const [response] = await sgMail.send(msg);
        return {
            success: true,
            messageId: response.headers["x-message-id"],
            statusCode: response.statusCode
        };
    } catch (error: any) {
        console.error("Error sending email:", error);
        throw error;
    }
};

/**
 * SES Domain Identity Functions
 */

export const requestDomainVerification = async (domain: string) => {
    const command = new VerifyDomainIdentityCommand({ Domain: domain });
    const response = await sesClient.send(command);
    return response.VerificationToken; // TXT record value
};

export const getDomainVerificationStatus = async (domain: string) => {
    const command = new GetIdentityVerificationAttributesCommand({
        Identities: [domain],
    });
    const response = await sesClient.send(command);
    const attributes = response.VerificationAttributes?.[domain];
    return attributes?.VerificationStatus || "NOT_FOUND";
};

export const getDomainDkimTokens = async (domain: string) => {
    const command = new VerifyDomainDkimCommand({ Domain: domain });
    const response = await sesClient.send(command);
    return response.DkimTokens; // Array of CNAME values
};

export const getDomainDkimStatus = async (domain: string) => {
    const command = new GetIdentityDkimAttributesCommand({
        Identities: [domain],
    });
    const response = await sesClient.send(command);
    const attributes = response.DkimAttributes?.[domain];
    return {
        tokens: attributes?.DkimTokens || [],
        status: attributes?.DkimVerificationStatus || "NOT_STARTED",
    };
};

export const injectComplianceFooter = (html: string, unsubscribeUrl: string) => {
    const footer = `
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; text-align: center;">
            <p>You received this email because you are on our mailing list.</p>
            <p><a href="${unsubscribeUrl}" style="color: #2563eb;">Unsubscribe from this list</a></p>
            <p>${process.env.SENDER_ADDRESS || "BulkMailer Inc, 123 Business Way, City, State"}</p>
        </div>
    `;

    if (html.includes("</body>")) {
        return html.replace("</body>", `${footer}</body>`);
    }
    return `${html}${footer}`;
};
