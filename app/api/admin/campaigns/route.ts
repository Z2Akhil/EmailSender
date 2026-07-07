import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
// Populate user to get user details
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(request: Request) {
    const denied = await requireAdmin();
    if (denied) return denied;

    try {
        await connectDB();
        const url = new URL(request.url);

        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "20");
        const search = url.searchParams.get("search") || "";
        const status = url.searchParams.get("status") || "all";

        const query: any = {};

        // 1. Search by campaign name
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }

        // 2. Filter by status
        if (status !== "all") {
            query.status = status;
        }

        const skip = (page - 1) * limit;

        const [campaigns, total] = await Promise.all([
            Campaign.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("userId", "name email"), // Attach the owner details
            Campaign.countDocuments(query)
        ]);

        return NextResponse.json({
            campaigns,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Error fetching admin campaigns:", error);
        return NextResponse.json(
            { error: "Failed to fetch campaigns" },
            { status: 500 }
        );
    }
}
