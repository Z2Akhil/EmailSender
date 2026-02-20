import sgMail from "@sendgrid/mail";
import { SESClient, SendRawEmailCommand, VerifyDomainIdentityCommand, GetIdentityVerificationAttributesCommand } from "@aws-sdk/client-ses";

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
}

export const sendEmail = async ({
    to,
    subject,
    html,
    fromName,
    fromEmail,
    replyTo
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
        // Prefer SES if configured
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
