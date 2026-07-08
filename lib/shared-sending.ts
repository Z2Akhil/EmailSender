/**
 * Shared "zero-setup" sending: campaigns with provider === "SHARED" send from a
 * single platform-verified SES identity (SHARED_FROM_EMAIL) with the sender's
 * brand name composed into the display name and Reply-To pointing at the user.
 *
 * Pure env reads on purpose — this module is imported by API routes AND the
 * worker process, and must never drag app-only dependencies into the worker.
 */

export function isSharedSendingEnabled(): boolean {
    return !!(
        process.env.SHARED_FROM_EMAIL &&
        process.env.AWS_ACCESS_KEY_ID &&
        process.env.AWS_SECRET_ACCESS_KEY
    );
}

export function getSharedFromEmail(): string | null {
    return process.env.SHARED_FROM_EMAIL || null;
}

export function getSharedSuffix(): string {
    return `via ${process.env.NEXT_PUBLIC_APP_NAME || "BulkMailer"}`;
}

export function composeSharedSender(fromName: string): { fromName: string; fromEmail: string } {
    const shared = process.env.SHARED_FROM_EMAIL;
    if (!shared) {
        throw new Error("SHARED_FROM_EMAIL is not configured in this process's environment");
    }
    return {
        fromName: `${fromName} ${getSharedSuffix()}`,
        fromEmail: shared,
    };
}
