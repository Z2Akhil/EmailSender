import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not defined");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-04-10.acacia" as any, // Using latest acacia or any to satisfy the lint
    typescript: true,
});

export const SUBSCRIPTION_PLANS = {
    FREE: {
        name: "Free",
        priceId: null,
        limits: {
            contacts: 500,
            emailsPerMonth: 1000,
        },
    },
    STARTER: {
        name: "Starter",
        priceId: process.env.STRIPE_PRICE_ID_STARTER,
        limits: {
            contacts: 5000,
            emailsPerMonth: 20000,
        },
    },
    PRO: {
        name: "Pro",
        priceId: process.env.STRIPE_PRICE_ID_PRO,
        limits: {
            contacts: 50000,
            emailsPerMonth: Infinity,
        },
    },
};

export function getPlanLimits(tier: "FREE" | "STARTER" | "PRO" = "FREE") {
    return SUBSCRIPTION_PLANS[tier].limits;
}

export async function checkPlanLimits(workspaceId: string, type: "contacts" | "emails") {
    const { Workspace } = await import("@/models/Workspace");
    const { Contact } = await import("@/models/Contact");
    const { Campaign } = await import("@/models/Campaign");
    const connectDB = (await import("@/lib/db")).default;

    await connectDB();
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const limits = getPlanLimits(workspace.planTier);

    if (type === "contacts") {
        const count = await Contact.countDocuments({ workspaceId }); // Need to ensure Contact has workspaceId or aggregate from lists
        // Note: Our Contact model has listId, and ContactList has workspaceId. 
        // We might need to join or add workspaceId to Contact for performance.
        return {
            allowed: count < limits.contacts,
            current: count,
            limit: limits.contacts,
        };
    }

    if (type === "emails") {
        // Calculate emails sent this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const campaigns = await Campaign.find({
            workspaceId,
            sentAt: { $gte: startOfMonth },
        });

        const sentThisMonth = campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0);

        return {
            allowed: sentThisMonth < limits.emailsPerMonth,
            current: sentThisMonth,
            limit: limits.emailsPerMonth,
        };
    }

    return { allowed: true };
}
