import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { Contact } from "@/models/Contact";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const workspaceId = session.user.workspaceId;

        // 1. Total Contacts
        const totalContacts = await Contact.countDocuments({ workspaceId });

        // 2. Campaigns Sent
        const totalCampaigns = await Campaign.countDocuments({
            workspaceId,
            status: "SENT"
        });

        // 3. Segmented Stats
        const campaigns = await Campaign.find({ workspaceId, status: "SENT" });

        const emailCampaigns = campaigns.filter(c => c.channel !== "WHATSAPP");
        const whatsappCampaigns = campaigns.filter(c => c.channel === "WHATSAPP");

        const totalEmailsSent = emailCampaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0);
        const totalWhatsappSent = whatsappCampaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0);

        const emailOpens = emailCampaigns.reduce((acc, c) => acc + (c.openCount || 0), 0);
        const avgEmailOpenRate = totalEmailsSent > 0 ? (emailOpens / totalEmailsSent) * 100 : 0;

        const whatsappOpens = whatsappCampaigns.reduce((acc, c) => acc + (c.openCount || 0), 0);
        const avgWhatsappOpenRate = totalWhatsappSent > 0 ? (whatsappOpens / totalWhatsappSent) * 100 : 0;

        const emailClicks = emailCampaigns.reduce((acc, c) => acc + (c.clickCount || 0), 0);
        const avgEmailClickRate = totalEmailsSent > 0 ? (emailClicks / totalEmailsSent) * 100 : 0;

        // 6. Recent Campaigns
        const recentCampaigns = await Campaign.find({ workspaceId })
            .sort({ updatedAt: -1 })
            .limit(5);

        return NextResponse.json({
            success: true,
            data: {
                totalContacts,
                totalCampaigns,
                totalEmailsSent,
                totalWhatsappSent,
                avgEmailOpenRate,
                avgWhatsappOpenRate,
                avgEmailClickRate,
                recentCampaigns
            }
        });
    } catch (error) {
        console.error("[DASHBOARD_STATS_ERROR]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
