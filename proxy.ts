// proxy.ts — Next.js 16 route protection (replaces middleware.ts)
// Protects /dashboard/* routes — redirects to /login if unauthenticated
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function proxy(req) {
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
    }
);

export const config = {
    matcher: ["/dashboard/:path*"],
};
