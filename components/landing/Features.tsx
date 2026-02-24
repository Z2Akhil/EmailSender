"use client";

import { useState, UIEvent } from "react";
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
    const [activeIndex, setActiveIndex] = useState(0);

    const handleScroll = (e: UIEvent<HTMLDivElement>) => {
        const { scrollLeft, scrollWidth, clientWidth } = e.currentTarget;
        if (scrollWidth <= clientWidth) return;
        const progress = scrollLeft / (scrollWidth - clientWidth);
        const index = Math.max(0, Math.min(features.length - 1, Math.round(progress * (features.length - 1))));
        setActiveIndex(index);
    };

    const handleDotClick = (index: number) => {
        const carousel = document.getElementById("features-carousel");
        if (carousel) {
            const itemWidth = carousel.scrollWidth / features.length;
            carousel.scrollTo({
                left: index * itemWidth,
                behavior: "smooth",
            });
            setActiveIndex(index);
        }
    };

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

                <FadeInStagger
                    id="features-carousel"
                    className="flex overflow-x-auto md:grid md:grid-cols-3 gap-8 pb-8 md:pb-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-6 px-6 md:mx-0 md:px-0"
                    onScroll={handleScroll}
                >
                    {features.map((f) => (
                        <FadeInStaggerItem key={f.title} direction="up" className="w-[85vw] sm:w-[320px] md:w-auto flex-shrink-0 snap-center md:snap-align-none">
                            <div className="bg-[#f0f2f6] rounded-[32px] p-4 pb-8 group cursor-default border-0 h-full">
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

                {/* Mobile Carousel Indicators */}
                <div className="flex md:hidden justify-center items-center gap-2 mt-4 pb-4">
                    {features.map((_, i) => (
                        <div
                            key={i}
                            onClick={() => handleDotClick(i)}
                            className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${i === activeIndex
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