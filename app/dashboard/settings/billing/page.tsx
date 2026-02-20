"use client";

import { useState } from "react";
import { Check, Loader2, Sparkles, CreditCard, Zap, Crown } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ApiResponse } from "@/types";

interface BillingInfo {
    planTier: "FREE" | "STARTER" | "PRO";
    subscriptionStatus: string;
    stripeCustomerId: string;
}

const PLANS = [
    {
        tier: "FREE",
        name: "Free Forever",
        price: "$0",
        description: "Perfect for exploring the platform",
        features: ["500 Contacts", "1,000 Emails / month", "Standard Templates", "Basic Analytics"],
        icon: Sparkles,
        color: "blue",
    },
    {
        tier: "STARTER",
        name: "Starter",
        price: "$29",
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER, // We'll need this on client side if hardcoded
        description: "Best for growing businesses",
        features: ["5,000 Contacts", "20,000 Emails / month", "Priority Support", "Advanced Analytics", "Custom Domains"],
        icon: Zap,
        color: "indigo",
    },
    {
        tier: "PRO",
        name: "Pro Professional",
        price: "$79",
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO,
        description: "Scale your reach to the moon",
        features: ["50,000 Contacts", "Unlimited Emails", "API Access", "Resend Fallback", "Dedicated Success Manager"],
        icon: Crown,
        color: "purple",
    },
];

export default function BillingPage() {
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    // Fetch current billing status (Wait, I need a GET /api/billing/info)
    const { data: billingInfo, isLoading } = useQuery<ApiResponse<BillingInfo>>({
        queryKey: ["billing-info"],
        queryFn: async () => {
            const res = await fetch("/api/billing/info");
            return res.json();
        },
    });

    const checkoutMutation = useMutation({
        mutationFn: async (priceId: string) => {
            setLoadingPlan(priceId);
            const res = await fetch("/api/billing/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ priceId }),
            });
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        },
        onSettled: () => setLoadingPlan(null),
    });

    const portalMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/billing/portal");
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        },
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading billing details...</p>
            </div>
        );
    }

    const currentTier = billingInfo?.data?.planTier || "FREE";

    return (
        <div className="max-w-6xl mx-auto pb-20">
            <div className="mb-10 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Plans</h1>
                <p className="text-gray-500">Choose the plan that fits your growth ambitions.</p>
            </div>

            {/* Current Plan Summary */}
            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <CreditCard className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Current Plan: {currentTier}</h2>
                        <p className="text-sm text-gray-500">
                            {currentTier === "FREE"
                                ? "You are currently on the free trial plan."
                                : `Your subscription is ${billingInfo?.data?.subscriptionStatus || "active"}.`}
                        </p>
                    </div>
                </div>
                {currentTier !== "FREE" && (
                    <button
                        onClick={() => portalMutation.mutate()}
                        className="bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-2xl hover:bg-gray-200 transition-colors"
                        disabled={portalMutation.isPending}
                    >
                        {portalMutation.isPending ? "Directing..." : "Manage Subscription"}
                    </button>
                )}
            </div>

            {/* Pricing Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {PLANS.map((plan) => {
                    const isCurrent = plan.tier === currentTier;
                    const isFree = plan.tier === "FREE";

                    return (
                        <div
                            key={plan.tier}
                            className={`bg-white rounded-3xl border ${isCurrent ? "border-blue-600 ring-4 ring-blue-50" : "border-gray-100"} p-8 flex flex-col shadow-sm hover:shadow-md transition-all relative overflow-hidden`}
                        >
                            {isCurrent && (
                                <div className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">
                                    Current
                                </div>
                            )}

                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${plan.color}-50 text-${plan.color}-600`}>
                                    <plan.icon className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                            </div>

                            <div className="mb-6">
                                <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                                <span className="text-gray-400 font-medium">/month</span>
                            </div>

                            <p className="text-gray-500 text-sm mb-8">{plan.description}</p>

                            <div className="space-y-4 mb-10 flex-1">
                                {plan.features.map((feature) => (
                                    <div key={feature} className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center p-1">
                                            <Check className="w-full h-full" />
                                        </div>
                                        {feature}
                                    </div>
                                ))}
                            </div>

                            {!isFree && (
                                <button
                                    onClick={() => checkoutMutation.mutate(plan.priceId!)}
                                    disabled={loadingPlan !== null || isCurrent}
                                    className={`w-full py-4 rounded-2xl font-bold transition-all ${isCurrent
                                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                            : "bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200"
                                        }`}
                                >
                                    {loadingPlan === plan.priceId ? (
                                        <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                    ) : isCurrent ? (
                                        "Current Plan"
                                    ) : (
                                        "Upgrade Now"
                                    )}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
