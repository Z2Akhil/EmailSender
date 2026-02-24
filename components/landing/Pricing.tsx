"use client";

import Link from "next/link";
import { useState, UIEvent } from "react";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/animations/FadeIn";

const plans = [
    {
        name: "Starter plan",
        for: "For individuals & new creators",
        monthlyPrice: 19,
        highlight: false,
        cta: "Get Started",
        features: [
            "1 active workspace",
            "500 contacts",
            "1,000 emails / month",
            "Basic analytics",
            "Seamless third-party integrations",
            "Community support",
        ],
    },
    {
        name: "Pro plan",
        for: "For freelancers & small teams",
        monthlyPrice: 49,
        highlight: true,
        cta: "Get Started",
        features: [
            "Unlimited campaigns",
            "25,000 contacts",
            "150,000 emails / month",
            "Real-time collaboration",
            "Advanced analytics",
            "Seamless third-party integrations",
            "Email & chat support",
        ],
    },
    {
        name: "Business plan",
        for: "For growing teams & agencies",
        monthlyPrice: 79,
        highlight: false,
        cta: "Get Started",
        features: [
            "Everything in Pro +",
            "Team management & permissions",
            "Enhanced security controls",
            "Priority integrations & API access",
            "Advanced cloud storage",
            "24/7 priority support",
        ],
    },
];

export default function Pricing() {
    const [yearly, setYearly] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = (e: UIEvent<HTMLDivElement>) => {
        const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
        if (scrollWidth <= clientWidth) return;
        const progress = scrollLeft / (scrollWidth - clientWidth);
        const index = Math.max(0, Math.min(plans.length - 1, Math.round(progress * (plans.length - 1))));
        setActiveIndex(index);
    };

    const displayPrice = (monthly: number) => {
        const amount = yearly ? Math.round(monthly * 0.8) : monthly;
        return `$${amount}`;
    };

    return (
        <section id="pricing" className="py-24 px-6 bg-white">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <FadeIn direction="up">
                    <div className="text-center mb-12">
                        <h2
                            className="font-black text-gray-900 mb-3"
                            style={{ fontSize: "clamp(32px, 4vw, 52px)", letterSpacing: "-0.03em" }}
                        >
                            Flexible pricing plans
                        </h2>
                        <p className="text-gray-500 text-base max-w-md mx-auto leading-relaxed">
                            Choose a plan that grows with you. Start for free and upgrade anytime
                            for more features and support
                        </p>

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
                                    className="absolute inset-0 rounded-full transition-colors duration-300"
                                    style={{ background: yearly ? "#5235EF" : "#D1D5DB" }}
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
                                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                                    style={{ color: "#5235EF" }}
                                >
                                    20% off
                                </span>
                            )}
                        </div>
                    </div>
                </FadeIn>

                {/* Cards */}
                <FadeInStagger
                    className="flex overflow-x-auto md:grid md:grid-cols-3 gap-6 pb-8 md:pb-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-6 px-6 md:mx-0 md:px-0"
                    // @ts-expect-error - onScroll is not in intrinsic attributes for motion.div directly easily but it works
                    onScroll={handleScroll}
                >
                    {plans.map((plan) => (
                        <FadeInStaggerItem key={plan.name} direction="up">
                            <div
                                className="w-[85vw] sm:w-[320px] md:w-auto flex-shrink-0 snap-center md:snap-align-none rounded-2xl p-7 border transition-all duration-300 flex flex-col h-full"
                                style={{
                                    background: "#FFFFFF",
                                    borderColor: "#E5E7EB",
                                    boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                                        "0 8px 32px rgba(0,0,0,0.10)";
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.boxShadow =
                                        "0 2px 16px rgba(0,0,0,0.06)";
                                }}
                            >
                                {/* Plan name + price on same row */}
                                <div className="flex items-start justify-between mb-1">
                                    <div>
                                        <div className="text-base font-bold text-gray-900">
                                            {plan.name}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-0.5">
                                            {plan.for}
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <span
                                            className="font-black"
                                            style={{
                                                fontSize: "40px",
                                                letterSpacing: "-0.04em",
                                                lineHeight: 1,
                                                color: "#111111",
                                            }}
                                        >
                                            {displayPrice(plan.monthlyPrice)}
                                        </span>
                                        <div className="text-xs text-gray-400 mt-0.5">/month</div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-100 my-5" />

                                {/* CTA */}
                                <Link
                                    href="/signup"
                                    className="block text-center text-sm font-bold py-3.5 rounded-xl transition-all mb-6"
                                    style={
                                        plan.highlight
                                            ? {
                                                background: "linear-gradient(135deg,#5235EF,#7C3AED)",
                                                color: "white",
                                            }
                                            : { background: "#111111", color: "white" }
                                    }
                                >
                                    {plan.cta}
                                </Link>

                                {/* Features */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                                        Included features:
                                    </p>
                                    <ul className="space-y-2.5">
                                        {plan.features.map((feat) => (
                                            <li key={feat} className="flex items-start gap-2">
                                                <span
                                                    className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                    style={{
                                                        background: plan.highlight
                                                            ? "#5235EF"
                                                            : "#111111",
                                                    }}
                                                />
                                                <span
                                                    className="text-sm"
                                                    style={{ color: "#374151" }}
                                                >
                                                    {feat}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </FadeInStaggerItem>
                    ))}
                </FadeInStagger>


                {/* Mobile Carousel Indicators */}
                <div className="flex md:hidden justify-center items-center gap-2 mt-4 pb-4">
                    {plans.map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 rounded-full transition-all duration-300 ${i === activeIndex
                                ? "w-6 bg-[#5235EF]"
                                : "w-2 bg-gray-200"
                                }`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
