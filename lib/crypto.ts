import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
    if (process.env.NODE_ENV === "production") {
        throw new Error("ENCRYPTION_KEY must be set in production");
    } else {
        console.warn("ENCRYPTION_KEY is not set. Using a fallback for development. DO NOT USE IN PRODUCTION.");
    }
}

const getSecretKey = () => {
    return crypto.scryptSync(ENCRYPTION_KEY || "fallback-secret", "salt", 32);
};

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getSecretKey(), iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const tag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

export function decrypt(text: string): string {
    const [ivHex, tagHex, encryptedHex] = text.split(":");
    if (!ivHex || !tagHex || !encryptedHex) {
        throw new Error("Invalid encrypted format");
    }

    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, getSecretKey(), iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

/**
 * HMAC signature for click-tracking URLs. Prevents the /api/track/click
 * endpoint from being abused as an open redirect: only URLs signed by the
 * worker at send time are redirected to.
 */
export function signTrackingUrl(recipientId: string, url: string): string {
    return crypto
        .createHmac("sha256", getSecretKey())
        .update(`${recipientId}:${url}`)
        .digest("hex");
}

export function verifyTrackingSignature(recipientId: string, url: string, signature: string): boolean {
    const expected = Buffer.from(signTrackingUrl(recipientId, url), "hex");
    let provided: Buffer;
    try {
        provided = Buffer.from(signature, "hex");
    } catch {
        return false;
    }
    return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
}
