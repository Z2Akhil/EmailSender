/**
 * Where tracking, unsubscribe and pixel URLs point.
 *
 * Open tracking, click rewriting and the unsubscribe link all embed an absolute
 * URL into the message. If that URL is not publicly reachable — the default in
 * local development, where it resolves to http://localhost:3000 — the recipient
 * gets a broken image, dead links and a non-functional unsubscribe. Spam filters
 * score exactly that combination as junk, so mail sent from a dev machine gets
 * filtered no matter how clean the copy is.
 *
 * Rather than ship broken links, tracking is skipped whenever the base URL is
 * not public, and unsubscribe falls back to a mailto: — which is a valid
 * List-Unsubscribe target and actually works for the recipient.
 */

const PRIVATE_HOST = /^(localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?)/i;

/**
 * The app's public origin, or null when it is missing / not reachable from the
 * outside world.
 */
export function getPublicBaseUrl(): string | null {
    const raw = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
    if (!raw) return null;

    let url: URL;
    try {
        url = new URL(raw);
    } catch {
        return null;
    }

    // http:// to a real host is still a (weak) spam signal, but it is the
    // unreachable hosts that actually break the message.
    if (PRIVATE_HOST.test(url.hostname) || url.hostname.endsWith(".local")) return null;

    return url.origin;
}

export interface TrackingContext {
    /** Absolute public origin, or null when tracking must be skipped. */
    baseUrl: string | null;
    enabled: boolean;
}

export function getTrackingContext(): TrackingContext {
    const baseUrl = getPublicBaseUrl();
    return { baseUrl, enabled: !!baseUrl };
}

/**
 * Unsubscribe target for a recipient. Falls back to a mailto: against the
 * campaign's reply address when there is no public URL to link to, so the
 * recipient always has a working way out.
 */
export function buildUnsubscribeUrl(
    baseUrl: string | null,
    recipientEmail: string,
    campaignId: string,
    fallbackAddress?: string | null
): string {
    if (baseUrl) {
        return `${baseUrl}/unsubscribe?email=${encodeURIComponent(recipientEmail)}&cid=${campaignId}`;
    }
    const address = fallbackAddress || recipientEmail;
    return `mailto:${address}?subject=${encodeURIComponent("Unsubscribe")}`;
}
