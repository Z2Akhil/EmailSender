"use client";

import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/animations/FadeIn";

const features = [
    {
        title: "Bulk WhatsApp Sender",
        description: "Blast messages to thousands of contacts instantly with 99% delivery rates and real-time status tracking.",
        imagePath: "/images/whatsapp-feature.avif", // Replace with your image
    },
    {
        title: "Advanced Email Blast",
        description: "High-inbox delivery for mass campaigns. Scale your outreach with automated warm-up and spam-filter bypass.",
        imagePath: "/images/email-feature.avif", // Replace with your image
    },
    {
        title: "Contact List Scaling",
        description: "Upload millions of leads via CSV. Automatically clean your list to remove dead numbers and invalid emails.",
        imagePath: "/images/list-feature.avif", // Replace with your image
    },
];

export default function Features() {
    return (
        <section id="features" className="py-24 px-6 bg-white">
            <div className="max-w-6xl mx-auto">
                <FadeIn direction="up">
                    <div className="text-center mb-16">
                        <h2
                            className="font-black mb-4"
                            style={{
                                fontSize: "clamp(32px,4vw,52px)",
                                letterSpacing: "-0.03em",
                                color: "#111111",
                            }}
                        >
                            Everything you need to run{" "}
                            <span
                                style={{
                                    background: "linear-gradient(135deg,#7C3AED,#A855F7,#EC4899)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                }}
                            >
                                winning campaigns
                            </span>
                        </h2>
                        <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
                            All the tools you need in one simple platform — no bloat, no confusion.
                        </p>
                    </div>
                </FadeIn>

                <FadeInStagger className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((f) => (
                        <FadeInStaggerItem key={f.title} direction="up">
                            <div className="bg-[#f0f2f6] rounded-[32px] p-4 pb-8 group cursor-default border-0">
                                {/* Static Image Container */}
                                <div className="relative aspect-[4/3] mb-6 overflow-hidden rounded-[24px]">
                                    <img
                                        src={f.imagePath}
                                        alt={f.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
                                </div>

                                <div className="px-3">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                                        {f.title}
                                    </h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">
                                        {f.description}
                                    </p>
                                </div>
                            </div>
                        </FadeInStaggerItem>
                    ))}
                </FadeInStagger>
            </div>
        </section>
    );
}