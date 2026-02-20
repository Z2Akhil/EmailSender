import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Workspace } from "@/models/Workspace";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const workspace = await Workspace.findById(session.user.workspaceId);

        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                planTier: workspace.planTier || "FREE",
                subscriptionStatus: workspace.subscriptionStatus || "active",
                stripeCustomerId: workspace.stripeCustomerId,
            }
        });
    } catch (error) {
        console.error("[BILLING_INFO_ERROR]", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
