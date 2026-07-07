import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Campaign } from "@/models/Campaign";
import { requireAdmin } from "@/lib/admin-auth";
// Note: Revenue/Invoices should theoretically come from Stripe API, but for simplicity
// we'll calculate based on DB subscriptions if tracked, or return placeholder/basic metrics first.

export async function GET() {
    const denied = await requireAdmin();
    if (denied) return denied;

    try {
        await connectDB();

        // 1. Total Users
        const totalUsers = await User.countDocuments();

        // 2. Active Users — accounts that are not suspended
        const activeUsersCount = await User.countDocuments({ isActive: { $ne: false } });

        // 3. Plan Distribution (User.plan mirrors Workspace.planTier)
        const freePlan = await User.countDocuments({ plan: "FREE" });
        const basicPlan = await User.countDocuments({ plan: "STARTER" });
        const proPlan = await User.countDocuments({ plan: "PRO" });

        // 4. Campaign Metrics
        const campaigns = await Campaign.find({}, "status sentCount failedCount");

        const totalCampaigns = campaigns.length;
        let emailsSent = 0;
        let emailsFailed = 0;

        campaigns.forEach(c => {
            emailsSent += (c.sentCount || 0);
            emailsFailed += (c.failedCount || 0);
        });

        // 5. Mock Revenue (In a real app, query Stripe)
        // Calculating an estimated MRR based on plans
        const basicPrice = 29; // example price
        const proPrice = 99;   // example price
        const estimatedRevenue = (basicPlan * basicPrice) + (proPlan * proPrice);

        return NextResponse.json({
            users: {
                total: totalUsers,
                active: activeUsersCount,
                distribution: {
                    free: freePlan,
                    basic: basicPlan,
                    pro: proPlan
                }
            },
            campaigns: {
                total: totalCampaigns,
                emailsSent: emailsSent,
                emailsFailed: emailsFailed,
            },
            revenue: {
                estimatedMRR: estimatedRevenue,
                currency: "USD"
            }
        });

    } catch (error) {
        console.error("Error fetching admin stats:", error);
        return NextResponse.json(
            { error: "Failed to fetch admin stats" },
            { status: 500 }
        );
    }
}
