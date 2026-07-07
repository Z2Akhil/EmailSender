import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Workspace } from "@/models/Workspace";
import { decrypt, encrypt } from "@/lib/crypto";

/**
 * GET /api/cron/whatsapp/refresh-tokens
 * This endpoint should be called by a secure cron job (e.g., Vercel Cron or GitHub Action).
 * It finds WhatsApp tokens expiring soon and refreshes them via the Meta API.
 */
export async function GET(req: Request) {
    // Basic security check for cron — fail closed if CRON_SECRET is not configured
    const authHeader = req.headers.get("authorization");
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();

        // 1. Find workspaces with WhatsApp tokens.
        // We'll refresh all tokens that exist, or we could add a lastRefreshedAt field.
        // Meta long-lived tokens are valid for 60 days.
        const workspaces = await Workspace.find({ 
            whatsappAccessToken: { $exists: true, $ne: null } 
        });

        const results = {
            total: workspaces.length,
            refreshed: 0,
            failed: 0,
            errors: [] as string[]
        };

        for (const workspace of workspaces) {
            try {
                const currentToken = decrypt(workspace.whatsappAccessToken!);
                
                // Meta Refresh endpoint: GET /oauth/access_token?grant_type=fb_exchange_token&client_id={app-id}&client_secret={app-secret}&fb_exchange_token={existing-token}
                const res = await fetch(
                    `https://graph.facebook.com/v19.0/oauth/access_token?` + 
                    new URLSearchParams({
                        grant_type: "fb_exchange_token",
                        client_id: process.env.WHATSAPP_APP_ID || "",
                        client_secret: process.env.WHATSAPP_APP_SECRET || "",
                        fb_exchange_token: currentToken
                    })
                );

                const data = await res.json();

                if (data.access_token) {
                    workspace.whatsappAccessToken = encrypt(data.access_token);
                    await workspace.save();
                    results.refreshed++;
                } else {
                    results.failed++;
                    results.errors.push(`Workspace ${workspace._id}: ${data.error?.message || "Unknown error"}`);
                }
            } catch (err: any) {
                results.failed++;
                results.errors.push(`Workspace ${workspace._id}: ${err.message}`);
            }
        }

        return NextResponse.json(results);

    } catch (error: any) {
        console.error("Token refresh cron error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
