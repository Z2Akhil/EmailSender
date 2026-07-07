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

        // 3. Discover which WABAs this token was granted access to.
        // The whatsapp_business_management scope records the selected WABA ids
        // as granular scopes on the token — no business_management needed.
        const appAccessToken = `${appId}|${appSecret}`;
        const debugRes = await fetch(
            `https://graph.facebook.com/v19.0/debug_token?input_token=${longLivedToken}&access_token=${appAccessToken}`
        );
        const debugData = await debugRes.json();

        const granular = debugData?.data?.granular_scopes || [];
        const wabaScope = granular.find((s: any) => s.scope === "whatsapp_business_management");
        let wabaIds: string[] = wabaScope?.target_ids || [];

        // Fallback: token granted for all WABAs (no target_ids) — try the
        // businesses route in case this app does have business_management
        if (wabaIds.length === 0) {
            const businessesRes = await fetch(`https://graph.facebook.com/v19.0/me/businesses?fields=id,name`, {
                headers: { Authorization: `Bearer ${longLivedToken}` }
            });
            const businessesData = await businessesRes.json();
            if (businessesData.data?.length > 0) {
                for (const business of businessesData.data) {
                    const wabasRes = await fetch(
                        `https://graph.facebook.com/v19.0/${business.id}/owned_whatsapp_business_accounts?fields=id`,
                        { headers: { Authorization: `Bearer ${longLivedToken}` } }
                    );
                    const wabasData = await wabasRes.json();
                    for (const w of wabasData.data || []) wabaIds.push(w.id);
                }
            }
        }

        if (wabaIds.length === 0) {
            console.error("No WABAs granted. debug_token:", JSON.stringify(debugData?.data?.granular_scopes));
            return NextResponse.redirect(new URL("/dashboard/settings/whatsapp?error=no_waba_found", req.url));
        }

        // 4 & 5. Fetch each WABA's name and phone numbers
        const businesses: { id: string; name: string }[] = [];
        const wabas: any[] = [];
        const phoneNumbers: any[] = [];

        for (const wabaId of wabaIds) {
            const wabaRes = await fetch(
                `https://graph.facebook.com/v19.0/${wabaId}?fields=id,name,owner_business_info`,
                { headers: { Authorization: `Bearer ${longLivedToken}` } }
            );
            const waba = await wabaRes.json();
            if (waba.error) {
                console.error(`Failed to fetch WABA ${wabaId}:`, JSON.stringify(waba.error));
                continue;
            }

            const businessId = waba.owner_business_info?.id || "direct";
            const businessName = waba.owner_business_info?.name || "Meta Business";
            if (!businesses.some(b => b.id === businessId)) {
                businesses.push({ id: businessId, name: businessName });
            }

            wabas.push({ id: waba.id, name: waba.name || `WABA ${waba.id}`, businessId });

            const phonesRes = await fetch(
                `https://graph.facebook.com/v19.0/${waba.id}/phone_numbers?fields=id,display_phone_number`,
                { headers: { Authorization: `Bearer ${longLivedToken}` } }
            );
            const phonesData = await phonesRes.json();
            for (const phone of phonesData.data || []) {
                phoneNumbers.push({
                    id: phone.id,
                    displayNumber: phone.display_phone_number || phone.id,
                    wabaId: waba.id
                });
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
