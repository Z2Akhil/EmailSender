import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import connectDB from "@/lib/db";
import { Workspace } from "@/models/Workspace";
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

            await Workspace.findOneAndUpdate(
                { stripeCustomerId: session.customer as string },
                {
                    stripeSubscriptionId: subscription.id,
                    stripePriceId: subscription.items.data[0].price.id,
                    subscriptionStatus: subscription.status,
                    planTier: getPlanTierFromPriceId(subscription.items.data[0].price.id),
                }
            );
            break;
        }

        case "customer.subscription.updated": {
            const subscription = event.data.object as Stripe.Subscription;
            await Workspace.findOneAndUpdate(
                { stripeSubscriptionId: subscription.id },
                {
                    stripePriceId: subscription.items.data[0].price.id,
                    subscriptionStatus: subscription.status,
                    planTier: getPlanTierFromPriceId(subscription.items.data[0].price.id),
                }
            );
            break;
        }

        case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            await Workspace.findOneAndUpdate(
                { stripeSubscriptionId: subscription.id },
                {
                    subscriptionStatus: "canceled",
                    planTier: "FREE",
                }
            );
            break;
        }
    }

    return NextResponse.json({ received: true });
}

function getPlanTierFromPriceId(priceId: string): "FREE" | "STARTER" | "PRO" {
    if (priceId === process.env.STRIPE_PRICE_ID_STARTER) return "STARTER";
    if (priceId === process.env.STRIPE_PRICE_ID_PRO) return "PRO";
    return "FREE";
}
