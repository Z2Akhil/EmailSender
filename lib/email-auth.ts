/**
 * Email authentication checks (SPF / DKIM / DMARC) over plain DNS.
 *
 * This replaces the old SES identity verification. Nothing here provisions
 * anything — sending happens through the workspace's own SMTP provider, and
 * that provider is what signs the mail. What the app can usefully do is read
 * the domain's public DNS and tell the user which of the three records are
 * missing or weak, because those three decide inbox vs spam far more than
 * anything in the message body.
 *
 * DKIM lives at <selector>._domainkey.<domain> and the selector is chosen by
 * the sending provider, so it cannot be discovered — we probe the selectors the
 * common providers use, plus whatever the user tells us.
 */

import { promises as dns } from "dns";

export type RecordStatus = "PASS" | "WARN" | "FAIL";

export interface RecordCheck {
    status: RecordStatus;
    /** The record as published, when one was found. */
    value?: string;
    /** Short, user-facing explanation of the status. */
    message: string;
    /** Present on WARN/FAIL: what to publish to fix it. */
    fix?: string;
}

export interface DomainAuthReport {
    domain: string;
    spf: RecordCheck;
    dkim: RecordCheck & { selector?: string };
    dmarc: RecordCheck;
    /** True only when all three pass — the campaign-ready state. */
    authenticated: boolean;
    checkedAt: Date;
}

/**
 * Selectors used by the SMTP providers this app is likely pointed at. Probed in
 * order; the first that resolves to a DKIM key wins.
 */
const KNOWN_DKIM_SELECTORS = [
    "default", "google", "selector1", "selector2", "s1", "s2",
    "zoho", "zmail", "mail", "dkim", "k1", "resend", "brevo", "mandrill",
    "smtp", "postmark", "pm", "sendgrid", "mailjet",
];

async function resolveTxtJoined(name: string): Promise<string[]> {
    try {
        // Each TXT answer is an array of ≤255-char strings that must be joined.
        const records = await dns.resolveTxt(name);
        return records.map((chunks) => chunks.join(""));
    } catch {
        return [];
    }
}

export async function checkSpf(domain: string): Promise<RecordCheck> {
    const fix = `Publish a TXT record at ${domain}: "v=spf1 include:<your-provider> ~all"`;
    const records = (await resolveTxtJoined(domain)).filter((r) => r.toLowerCase().startsWith("v=spf1"));

    if (records.length === 0) {
        return { status: "FAIL", message: "No SPF record found — receivers cannot confirm who may send for this domain.", fix };
    }
    // More than one SPF record is a hard failure per RFC 7208, not a warning.
    if (records.length > 1) {
        return {
            status: "FAIL",
            value: records.join(" | "),
            message: `${records.length} SPF records published. A domain must have exactly one; receivers treat multiples as permerror.`,
            fix: "Merge every include: into a single v=spf1 record and delete the rest.",
        };
    }

    const value = records[0];
    if (/[?+]all\s*$/.test(value)) {
        return {
            status: "WARN",
            value,
            message: "SPF ends in +all or ?all, which lets anyone send as your domain.",
            fix: 'End the record with "~all" (softfail) or "-all" (hard fail).',
        };
    }
    if (!/[-~]all\s*$/.test(value)) {
        return {
            status: "WARN",
            value,
            message: "SPF has no all mechanism, so unlisted senders are left unqualified.",
            fix: 'Append "~all" to the end of the record.',
        };
    }

    return { status: "PASS", value, message: "SPF record published and correctly terminated." };
}

export async function checkDkim(
    domain: string,
    selector?: string
): Promise<RecordCheck & { selector?: string }> {
    const fix =
        "Copy the DKIM record from your SMTP provider's dashboard (Zoho, Gmail, Resend, Brevo…) " +
        "and publish it at <selector>._domainkey." + domain;

    const candidates = selector ? [selector, ...KNOWN_DKIM_SELECTORS] : KNOWN_DKIM_SELECTORS;

    for (const candidate of candidates) {
        const host = `${candidate}._domainkey.${domain}`;
        const txt = (await resolveTxtJoined(host)).find((r) => /(^|;)\s*(v=DKIM1|k=rsa|p=)/i.test(r));
        if (txt) {
            // A published record with an empty p= is a revoked key.
            if (/(^|;)\s*p=\s*(;|$)/i.test(txt)) {
                return {
                    status: "FAIL",
                    selector: candidate,
                    value: txt,
                    message: `DKIM key at ${candidate} is revoked (empty p= value).`,
                    fix,
                };
            }
            return {
                status: "PASS",
                selector: candidate,
                value: txt.length > 120 ? `${txt.slice(0, 120)}…` : txt,
                message: `DKIM key published at selector "${candidate}".`,
            };
        }
        // CNAME-delegated DKIM (SES-style, and what Resend/Brevo often use).
        try {
            const cname = await dns.resolveCname(host);
            if (cname.length) {
                return {
                    status: "PASS",
                    selector: candidate,
                    value: `CNAME → ${cname[0]}`,
                    message: `DKIM delegated via CNAME at selector "${candidate}".`,
                };
            }
        } catch {
            // Not delegated at this selector either — keep probing.
        }
    }

    return {
        status: "FAIL",
        message: selector
            ? `No DKIM key found at ${selector}._domainkey.${domain}.`
            : "No DKIM key found at any common selector. Add your provider's selector to check a specific one.",
        fix,
    };
}

export async function checkDmarc(domain: string): Promise<RecordCheck> {
    const fix = `Publish a TXT record at _dmarc.${domain}: "v=DMARC1; p=none; rua=mailto:you@${domain}"`;
    const records = (await resolveTxtJoined(`_dmarc.${domain}`)).filter((r) =>
        r.toLowerCase().startsWith("v=dmarc1")
    );

    if (records.length === 0) {
        return {
            status: "FAIL",
            message: "No DMARC record. Gmail and Yahoo require one from bulk senders.",
            fix,
        };
    }

    const value = records[0];
    const policy = /p=\s*(none|quarantine|reject)/i.exec(value)?.[1]?.toLowerCase();

    if (policy === "none") {
        return {
            status: "WARN",
            value,
            message: "DMARC is in monitor-only mode (p=none). It satisfies the requirement but enforces nothing.",
            fix: "Once SPF and DKIM pass consistently, move to p=quarantine, then p=reject.",
        };
    }

    return { status: "PASS", value, message: `DMARC published with p=${policy}.` };
}

/** Runs all three checks in parallel and summarises them. */
export async function checkDomainAuth(domain: string, dkimSelector?: string): Promise<DomainAuthReport> {
    const normalized = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

    const [spf, dkim, dmarc] = await Promise.all([
        checkSpf(normalized),
        checkDkim(normalized, dkimSelector),
        checkDmarc(normalized),
    ]);

    return {
        domain: normalized,
        spf,
        dkim,
        dmarc,
        authenticated: spf.status !== "FAIL" && dkim.status === "PASS" && dmarc.status !== "FAIL",
        checkedAt: new Date(),
    };
}
