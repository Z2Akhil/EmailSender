import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Workspace } from "@/models/Workspace";
import { MetaAssetCache } from "@/models/MetaAssetCache";
import { encrypt } from "@/lib/crypto";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        const url = new URL(req.url);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error) {
            console.error("Meta OAuth Error:", error);
            return NextResponse.redirect(new URL("/dashboard/settings/whatsapp?error=oauth_denied", req.url));
        }

        if (!code) {
            return NextResponse.redirect(new URL("/dashboard/settings/whatsapp?error=missing_code", req.url));
        }

        const appId = process.env.WHATSAPP_APP_ID;
        const appSecret = process.env.WHATSAPP_APP_SECRET;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const redirectUri = `${appUrl}/api/whatsapp/oauth/callback`;

        if (!appId || !appSecret) {
            return NextResponse.redirect(new URL("/dashboard/settings/whatsapp?error=missing_env", req.url));
        }

        // 1. Exchange code for short-lived access token
        const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`);
        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            console.error("Token Exchange Error:", tokenData.error);
            return NextResponse.redirect(new URL("/dashboard/settings/whatsapp?error=token_exchange_failed", req.url));
        }

        const shortLivedToken = tokenData.access_token;

        // 2. Exchange short-lived token for long-lived token (60 days)
        const longTokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`);
        const longTokenData = await longTokenRes.json();
        
        const longLivedToken = longTokenData.access_token || shortLivedToken;

        // 3. Get User's Businesses (Modify to fetch all and their names)
        const businessesRes = await fetch(`https://graph.facebook.com/v19.0/me/businesses?fields=id,name`, {
            headers: { Authorization: `Bearer ${longLivedToken}` }
        });
        const businessesData = await businessesRes.json();

        if (businessesData.error || !businessesData.data || businessesData.data.length === 0) {
            return NextResponse.redirect(new URL("/dashboard/settings/whatsapp?error=no_business_found", req.url));
        }

        const businesses = businessesData.data.map((b: any) => ({ id: b.id, name: b.name || `Business ${b.id}` }));
        const wabas: any[] = [];
        const phoneNumbers: any[] = [];

        // 4 & 5. Get WABA IDs and Phone Numbers for ALL businesses
        for (const business of businesses) {
            const wabasRes = await fetch(`https://graph.facebook.com/v19.0/${business.id}/owned_whatsapp_business_accounts?fields=id,name`, {
                headers: { Authorization: `Bearer ${longLivedToken}` }
            });
            const wabasData = await wabasRes.json();
            
            if (wabasData.data && wabasData.data.length > 0) {
                for (const waba of wabasData.data) {
                    wabas.push({ id: waba.id, name: waba.name || `WABA ${waba.id}`, businessId: business.id });

                    const phonesRes = await fetch(`https://graph.facebook.com/v19.0/${waba.id}/phone_numbers?fields=id,display_phone_number`, {
                        headers: { Authorization: `Bearer ${longLivedToken}` }
                    });
                    const phonesData = await phonesRes.json();

                    if (phonesData.data && phonesData.data.length > 0) {
                        for (const phone of phonesData.data) {
                            phoneNumbers.push({
                                id: phone.id,
                                displayNumber: phone.display_phone_number || phone.id,
                                wabaId: waba.id
                            });
                        }
                    }
                }
            }
        }

        if (phoneNumbers.length === 0) {
            return NextResponse.redirect(new URL("/dashboard/settings/whatsapp?error=no_phone_number_found", req.url));
        }

        // 6. Save to Cache Database instead of Workspace directly
        await connectDB();
        const workspaceId = session.user.workspaceId;

        const encryptedToken = encrypt(longLivedToken);

        // Expire cache in 1 hour
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        await MetaAssetCache.findOneAndUpdate(
            { workspaceId },
            {
                workspaceId,
                accessToken: encryptedToken,
                businesses,
                wabas,
                phoneNumbers,
                expiresAt
            },
            { upsert: true, new: true }
        );

        return NextResponse.redirect(new URL("/dashboard/settings/whatsapp?step=select_asset", req.url));

    } catch (error) {
        console.error("WhatsApp OAuth callback error:", error);
        return NextResponse.redirect(new URL("/dashboard/settings/whatsapp?error=server_error", req.url));
    }
}
