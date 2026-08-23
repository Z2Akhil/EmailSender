/**
 * Email sending — SMTP only.
 *
 * Every campaign goes out through the workspace's own SMTP account (Settings →
 * SMTP), so mail is sent from the user's real address on their provider's
 * infrastructure. There is no platform-level fallback provider: if SMTP is not
 * configured the send fails loudly rather than silently logging, which is the
 * behaviour that used to hide misconfiguration in development.
 *
 * Deliverability rules baked in here, because they decide inbox vs spam:
 *   - a text/plain alternative always accompanies the HTML (a HTML-only body is
 *     a strong spam signal)
 *   - List-Unsubscribe + List-Unsubscribe-Post headers, so Gmail/Outlook show a
 *     native unsubscribe button (required by both for bulk senders)
 *   - envelope sender matches the From address, so SPF aligns for DMARC
 */

import nodemailer, { type Transporter } from "nodemailer";

export interface SmtpConfig {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
}

export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    /** Overrides the auto-generated plain-text alternative. */
    text?: string;
    fromName?: string;
    fromEmail?: string;
    replyTo?: string;
    /** Powers the one-click unsubscribe headers. */
    unsubscribeUrl?: string;
    smtpConfig?: SmtpConfig;
}

export class SmtpNotConfiguredError extends Error {
    constructor() {
        super("No SMTP server is configured for this workspace. Add one in Settings → SMTP.");
        this.name = "SmtpNotConfiguredError";
    }
}

/**
 * Transports are cached per credential set: a bulk campaign is thousands of
 * sends through the same account, and a fresh TCP+TLS handshake per message is
 * both slow and a good way to get rate-limited.
 */
const transporterCache = new Map<string, Transporter>();

function cacheKey(config: SmtpConfig): string {
    // The password is part of the key so a credential change in Settings takes
    // effect in the long-running worker instead of reusing a stale pool.
    return [config.host, config.port, config.secure, config.user, config.pass].join("\u0000");
}

function getTransporter(config: SmtpConfig): Transporter {
    const key = cacheKey(config);
    const cached = transporterCache.get(key);
    if (cached) return cached;

    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: { user: config.user, pass: config.pass },
        // Reuse one connection for many messages instead of one per send.
        pool: true,
        maxConnections: 3,
        maxMessages: 100,
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 30000,
        tls: { rejectUnauthorized: process.env.NODE_ENV === "production" },
    });

    transporterCache.set(key, transporter);
    return transporter;
}

/** Drops a cached transport, e.g. after the workspace changes its credentials. */
export function resetTransporter(config?: SmtpConfig) {
    if (!config) {
        transporterCache.forEach((t) => t.close());
        transporterCache.clear();
        return;
    }
    const key = cacheKey(config);
    transporterCache.get(key)?.close();
    transporterCache.delete(key);
}

/**
 * Readable plain-text rendering of the HTML body. Not a full converter — it
 * keeps link targets visible and collapses the rest, which is what a text part
 * is for.
 */
export function htmlToText(html: string): string {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        // Keep the destination of a link next to its text.
        .replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, label) => {
            const text = String(label).replace(/<[^>]+>/g, "").trim();
            return text && !href.startsWith("mailto:") ? `${text} (${href})` : text || href;
        })
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|h[1-6]|li|tr|table|blockquote)>/gi, "\n\n")
        .replace(/<li\b[^>]*>/gi, "• ")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

export const sendEmail = async ({
    to,
    subject,
    html,
    text,
    fromName,
    fromEmail,
    replyTo,
    unsubscribeUrl,
    smtpConfig,
}: SendEmailOptions) => {
    if (!smtpConfig?.host || !smtpConfig?.user) {
        throw new SmtpNotConfiguredError();
    }

    // The From address must be an identity the SMTP account is allowed to send
    // as; falling back to the authenticated user is the safest default.
    const senderAddress = fromEmail || smtpConfig.user;
    const from = fromName ? `"${fromName}" <${senderAddress}>` : senderAddress;

    const headers: Record<string, string> = {};
    if (unsubscribeUrl) {
        headers["List-Unsubscribe"] = `<${unsubscribeUrl}>`;
        headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }

    const info = await getTransporter(smtpConfig).sendMail({
        from,
        to,
        subject,
        html,
        text: text || htmlToText(html),
        replyTo: replyTo || senderAddress,
        // SPF checks the envelope sender; aligning it with From keeps DMARC happy.
        envelope: { from: senderAddress, to },
        headers,
    });

    return { success: true, messageId: info.messageId };
};

/** One-off verification used by Settings → SMTP. */
export const verifySmtpConnection = async (config: SmtpConfig) => {
    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: { user: config.user, pass: config.pass },
        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 20000,
        tls: { rejectUnauthorized: process.env.NODE_ENV === "production" },
    });
    try {
        await transporter.verify();
        return true;
    } finally {
        transporter.close();
    }
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
