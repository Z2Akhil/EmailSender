"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useState } from "react";

const plans = [
    {
        name: "Starter plan",
        for: "For individuals & new creators",
        monthlyPrice: 0,
        highlight: false,
        cta: "Get Started",
        features: [
            "1 active workspace",
            "500 contacts",
            "1,000 emails / month",
            "Basic analytics",
            "Community support",
        ],
    },
    {
        name: "Pro plan",
        for: "For freelancers & small teams",
        monthlyPrice: 19,
        highlight: true,
        cta: "Get Started",
        features: [
            "Unlimited campaigns",
            "25,000 contacts",
            "150,000 emails / month",
            "Real-time analytics",
            "Seamless integrations",
            "Email & chat support",
        ],
    },
    {
        name: "Business plan",
        for: "For growing teams & agencies",
        monthlyPrice: 49,
        highlight: false,
        cta: "Get Started",
        features: [
            "Everything in Pro+",
            "Unlimited contacts",
            "Team management",
            "Priority API & integrations",
            "Advanced analytics",
            "24/7 priority support",
        ],
    },
];

export default function Pricing() {
    const [yearly, setYearly] = useState(true);

    const displayPrice = (monthly: number) => {
        if (monthly === 0) return "$0";
        const amount = yearly ? Math.round(monthly * 0.8) : monthly;
        return `$${amount}`;
    };

    return (
        <section id="pricing" className="py-24 px-6" style={{ background: "#f0f2f6" }}>
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <p className="text-gray-500 mb-3 text-sm font-medium uppercase tracking-widest">
                        Pricing
                    </p>
                    <h2
                        className="font-black text-gray-900 mb-4"
                        style={{ fontSize: "clamp(28px,4vw,48px)", letterSpacing: "-0.03em" }}
                    >
                        Choose a plan that grows with you.
                        <br />
                        <span className="text-gray-400 font-medium text-2xl">
                            Start for free and upgrade anytime.
                        </span>
                    </h2>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-3 mt-8">
                        <span
                            className="text-sm font-medium"
                            style={{ color: !yearly ? "#111111" : "#9CA3AF" }}
                        >
                            Monthly
                        </span>
                        <label className="relative w-12 h-7 cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={yearly}
                                onChange={() => setYearly(!yearly)}
                            />
                            <div
                                className="absolute inset-0 rounded-full transition-colors"
                                style={{ background: "#7C3AED" }}
                            />
                            <div
                                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all duration-300"
                                style={{ left: yearly ? "24px" : "4px" }}
                            />
                        </label>
                        <span
                            className="text-sm font-medium"
                            style={{ color: yearly ? "#111111" : "#9CA3AF" }}
                        >
                            Yearly
                        </span>
                        {yearly && (
                            <span
                                className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                                style={{ background: "#10B981" }}
                            >
                                20% off
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div
                            key={plan.name}
                            className="rounded-3xl p-8 border transition-all duration-300"
                            style={
                                plan.highlight
                                    ? { background: "#7C3AED", borderColor: "#7C3AED" }
                                    : { background: "white", borderColor: "#E5E7EB" }
                            }
                            onMouseEnter={(e) => {
                                if (!plan.highlight)
                                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                                        "0 8px 40px rgba(0,0,0,0.08)";
                            }}
                            onMouseLeave={(e) => {
                                if (!plan.highlight)
                                    (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                            }}
                        >
                            <div
                                className="text-sm font-semibold mb-1"
                                style={{ color: plan.highlight ? "#DDD6FE" : "#6B7280" }}
                            >
                                {plan.name}
                            </div>
                            <div
                                className="text-xs mb-6"
                                style={{ color: plan.highlight ? "#C4B5FD" : "#9CA3AF" }}
                            >
                                {plan.for}
                            </div>

                            <div className="flex items-baseline gap-1 mb-6">
                                <span
                                    className="font-black"
                                    style={{
                                        fontSize: "52px",
                                        letterSpacing: "-0.04em",
                                        lineHeight: 1,
                                        color: plan.highlight ? "white" : "#111111",
                                    }}
                                >
                                    {displayPrice(plan.monthlyPrice)}
                                </span>
                                <span
                                    className="text-sm"
                                    style={{ color: plan.highlight ? "#C4B5FD" : "#9CA3AF" }}
                                >
                                    {plan.monthlyPrice === 0 ? "/ forever" : "/month"}
                                </span>
                            </div>

                            <Link
                                href="/signup"
                                className="block text-center text-sm font-bold py-3 rounded-2xl transition-all"
                                style={
                                    plan.highlight
                                        ? { background: "white", color: "#7C3AED" }
                                        : { background: "#111111", color: "white" }
                                }
                            >
                                {plan.cta}
                            </Link>

                            <div className="mt-6 space-y-2.5">
                                <div
                                    className="text-xs font-semibold uppercase tracking-widest mb-3"
                                    style={{ color: plan.highlight ? "#C4B5FD" : "#9CA3AF" }}
                                >
                                    Included features
                                </div>
                                {plan.features.map((feat) => (
                                    <div key={feat} className="flex items-start gap-2.5">
                                        <Check
                                            className="w-4 h-4 shrink-0 mt-0.5"
                                            style={{ color: plan.highlight ? "white" : "#7C3AED" }}
                                        />
                                        <span
                                            className="text-sm"
                                            style={{ color: plan.highlight ? "#DDD6FE" : "#4B5563" }}
                                        >
                                            {feat}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
