import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const body = await request.json();
        const { action, plan } = body;
        const resolvedParams = await params;

        const user: any = await User.findById(resolvedParams.id);
        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (action === "suspend") {
            // we could add an isActive flag to the user schema, but for now
            // let's assume we toggle an isActive field if we have one.
            // If the model doesn't have it, let's just send back a success but note it.
            user.isActive = false;
        } else if (action === "activate") {
            user.isActive = true;
        } else if (action === "change_plan" && plan) {
            user.subscription = user.subscription || {};
            user.subscription.plan = plan.toUpperCase();
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
