import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Campaign, CampaignRecipient } from "@/models/Campaign";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const campaignId = id;

        // 1. Fetch Campaign
        const campaign = await Campaign.findOne({
            _id: campaignId,
            workspaceId: session.user.workspaceId
        });

        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        // 2. Aggregate status breakdown
        const statusBreakdown = await CampaignRecipient.aggregate([
            { $match: { campaignId: campaign._id } },
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        // 3. Generate timeline data (last 24-48 hours)
        // For simplicity, we'll just aggregate by day/hour from openedAt
        const timelineData = await CampaignRecipient.aggregate([
            {
                $match: {
                    campaignId: campaign._id,
                    openedAt: { $ne: null }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$openedAt" },
                        month: { $month: "$openedAt" },
                        day: { $dayOfMonth: "$openedAt" },
                        hour: { $hour: "$openedAt" }
                    },
                    opens: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.hour": 1 } },
            { $limit: 48 }
        ]);

        // Format timeline data for the chart
        const formattedTimeline = timelineData.map(item => ({
            time: `${item._id.day}/${item._id.month} ${item._id.hour}:00`,
            opens: item.opens
        }));

        return NextResponse.json({
            success: true,
            data: {
                campaign,
                statusBreakdown: statusBreakdown.reduce((acc: any, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                timeline: formattedTimeline
            }
        });
    } catch (error) {
        console.error("[CAMPAIGN_STATS_ERROR]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
