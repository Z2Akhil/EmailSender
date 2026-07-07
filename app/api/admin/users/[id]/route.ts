import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Workspace } from "@/models/Workspace";
import { requireAdmin } from "@/lib/admin-auth";

const VALID_PLANS = ["FREE", "STARTER", "PRO"] as const;

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const denied = await requireAdmin();
    if (denied) return denied;

    try {
        await connectDB();
        const body = await request.json();
        const { action, plan } = body;
        const resolvedParams = await params;

        const user = await User.findById(resolvedParams.id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (action === "suspend") {
            user.isActive = false;
        } else if (action === "activate") {
            user.isActive = true;
        } else if (action === "change_plan" && plan) {
            const newPlan = String(plan).toUpperCase() as (typeof VALID_PLANS)[number];
            if (!VALID_PLANS.includes(newPlan)) {
                return NextResponse.json({ error: `Invalid plan: ${plan}` }, { status: 400 });
            }
            // Keep the mirror and the source of truth in sync
            user.plan = newPlan;
            await Workspace.updateMany({ ownerId: user._id }, { planTier: newPlan });
        } else {
            return NextResponse.json({ error: "Unknown action" }, { status: 400 });
        }

        await user.save();

        return NextResponse.json({ success: true, user });
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json(
            { error: "Failed to update user" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const denied = await requireAdmin();
    if (denied) return denied;

    try {
        await connectDB();
        const resolvedParams = await params;
        await User.findByIdAndDelete(resolvedParams.id);

        // Note: In a real prod app, you'd also delete their campaigns, domains, etc.
        // For now, removing the user is the baseline.

        return NextResponse.json({ success: true, message: "User deleted" });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json(
            { error: "Failed to delete user" },
            { status: 500 }
        );
    }
}
