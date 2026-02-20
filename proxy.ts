// proxy.ts — Next.js 16 global middleware & route protection
import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";
import { globalRateLimit } from "@/lib/ratelimit";

export default withAuth(
    async function middleware(req) {
        const url = req.nextUrl.pathname;
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1";

        // 1. Rate Limiting for API routes
        if (url.startsWith("/api")) {
            const { success, limit, reset, remaining } = await globalRateLimit.limit(ip);

            if (!success) {
                return new NextResponse("Too Many Requests", {
                    status: 429,
                    headers: {
                        "X-RateLimit-Limit": limit.toString(),
                        "X-RateLimit-Remaining": remaining.toString(),
                        "X-RateLimit-Reset": reset.toString(),
                    },
                });
            }
        }

        const response = NextResponse.next();

        // 2. Add security headers to all responses
        response.headers.set("X-DNS-Prefetch-Control", "on");
        response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
        response.headers.set("X-Frame-Options", "SAMEORIGIN");
        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("Referrer-Policy", "origin-when-cross-origin");

        return response;
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                // Only enforce authentication for dashboard routes
                if (req.nextUrl.pathname.startsWith("/dashboard")) {
                    return !!token;
                }
                // All other routes (API, Landing, etc.) are public by default at this layer
                return true;
            },
        },
    }
);

export const config = {
    matcher: ["/api/:path*", "/dashboard/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
