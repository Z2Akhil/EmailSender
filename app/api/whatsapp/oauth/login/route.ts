import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    console.log("WhatsApp OAuth Login initiated...");
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        console.warn("OAuth Login: Unauthorized");
        return new Response("Unauthorized", { status: 401 });
    }

    const appId = process.env.WHATSAPP_APP_ID;
    if (!appId) {
        console.error("OAuth Login: Missing WHATSAPP_APP_ID");
        return new Response("Missing WHATSAPP_APP_ID in environment", { status: 500 });
    }

    // Determine base URL dynamically from request
    const host = req.headers.get("host") || "localhost:3000";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1") || host.startsWith("10.") || host.startsWith("192.168.");
    const protocol = isLocal ? "http" : "https";
    
    // Use NEXT_PUBLIC_APP_URL if available, otherwise fallback to detected host
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || `${protocol}://${host}`;
    const redirectUri = `${appUrl}/api/whatsapp/oauth/callback`;
    
    // Only WhatsApp scopes: business_management is not available to this app
    // type ("Invalid Scopes" from Meta). The callback discovers granted WABAs
    // via debug_token granular scopes instead of /me/businesses.
    const scopes = "whatsapp_business_management,whatsapp_business_messaging";
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`;

    console.log("Redirecting to Meta:", authUrl);

    return new Response(null, {
        status: 307,
        headers: {
            Location: authUrl,
        },
    });
}
