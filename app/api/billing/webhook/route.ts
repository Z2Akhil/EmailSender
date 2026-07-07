import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import connectDB from "@/lib/db";
import { Workspace } from "@/models/Workspace";
import { User } from "@/models/User";
import { headers } from "next/headers";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    await connectDB();

    switch (event.type) {
        case "checkout.session.completed": {
            const subscription = await stripe.subscriptions.retrieve(
                session.subscription as string
            );

            const workspace = await Workspace.findOneAndUpdate(
                { stripeCustomerId: session.customer as string },
                {
                    stripeSubscriptionId: subscription.id,
                    stripePriceId: subscription.items.data[0].price.id,
                    subscriptionStatus: subscription.status,
                    planTier: getPlanTierFromPriceId(subscription.items.data[0].price.id),
                },
                { new: true }
            );
            await syncOwnerPlan(workspace);
            break;
        }

        case "customer.subscription.updated": {
            const subscription = event.data.object as Stripe.Subscription;
            const workspace = await Workspace.findOneAndUpdate(
                { stripeSubscriptionId: subscription.id },
                {
                    stripePriceId: subscription.items.data[0].price.id,
                    subscriptionStatus: subscription.status,
                    planTier: getPlanTierFromPriceId(subscription.items.data[0].price.id),
                },
                { new: true }
            );
            await syncOwnerPlan(workspace);
            break;
        }

        case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            const workspace = await Workspace.findOneAndUpdate(
                { stripeSubscriptionId: subscription.id },
                {
                    subscriptionStatus: "canceled",
                    planTier: "FREE",
                },
                { new: true }
            );
            await syncOwnerPlan(workspace);
            break;
        }
    }

    return NextResponse.json({ received: true });
}

// Workspace.planTier is the source of truth for entitlements; User.plan is a
// denormalized mirror kept in sync here so admin queries and the session JWT
// can read the plan without a workspace join.
async function syncOwnerPlan(workspace: { ownerId: unknown; planTier: string } | null) {
    if (!workspace) return;
    await User.findByIdAndUpdate(workspace.ownerId, { plan: workspace.planTier });
}

function getPlanTierFromPriceId(priceId: string): "FREE" | "STARTER" | "PRO" {
    if (priceId === process.env.STRIPE_PRICE_ID_STARTER) return "STARTER";
    if (priceId === process.env.STRIPE_PRICE_ID_PRO) return "PRO";
    return "FREE";
}
