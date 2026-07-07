import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const secretKey = process.env.ADMIN_JWT_SECRET;
const key = new TextEncoder().encode(secretKey);

export async function authorizeAdmin(username?: string, password?: string) {
    if (!username || !password) return false;

    // Compare against env vars
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Safety check: ensure env vars are actually configured
    if (!adminUsername || !adminPassword || !secretKey) {
        console.error("Admin credentials or JWT secret are not properly configured in environment variables.");
        return false;
    }

    return username === adminUsername && password === adminPassword;
}

export async function createAdminToken() {
    // Generate a secure JWT using modern Edge-compatible jose library
    const token = await new SignJWT({ role: "admin" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(key);

    return token;
}

export async function verifyAdminToken(token: string) {
    if (!secretKey) return null;

    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: ["HS256"],
        });

        return payload;
    } catch (error) {
        return null;
    }
}

export async function setAdminCookie(token: string) {
    const cookieStore = await cookies();
    cookieStore.set("admin_token", token, {
        httpOnly: true, // Prevents XSS stealing
        secure: process.env.NODE_ENV === "production", // HTTPS only in prod
        sameSite: "strict", // CSRF protection
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
    });
}

export async function clearAdminCookie() {
    const cookieStore = await cookies();
    cookieStore.delete("admin_token");
}

/**
 * Route-level admin guard for /api/admin/* handlers.
 * Returns null when the request carries a valid admin token,
 * otherwise a 401 response the handler should return immediately.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyAdminToken(token);
    if (!payload || payload.role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return null;
}
