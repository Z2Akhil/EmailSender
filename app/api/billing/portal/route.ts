import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
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

        if (!workspace || !workspace.stripeCustomerId) {
            return NextResponse.json({ error: "Customer not found" }, { status: 404 });
        }

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: workspace.stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
        });

        return NextResponse.json({ url: portalSession.url });
    } catch (error) {
        console.error("[STRIPE_PORTAL_ERROR]", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
