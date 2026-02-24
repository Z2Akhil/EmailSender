"use client";

import { useState } from "react";
import { FadeIn } from "@/components/animations/FadeIn";

const testimonials = [
    {
        id: 0,
        name: "Emily Ray",
        role: "UX Designer",
        company: "PixelCraft",
        avatarSeed: "emily",
        quote:
            "This tool has completely transformed how our team manages email campaigns. The real-time analytics and seamless integrations make our process so much smoother!",
    },
    {
        id: 1,
        name: "Sofia Delgado",
        role: "Product Manager",
        company: "NovaTech",
        avatarSeed: "sofia",
        quote:
            "Before BulkMailer, we juggled five different tools to manage clients, tasks, and reports. Now it's all in one place. We launched 3 campaigns faster this quarter than ever before.",
    },
    {
        id: 2,
        name: "James Kim",
        role: "Growth Lead",
        company: "SkaleCo",
        avatarSeed: "james",
        quote:
            "BulkMailer is ridiculously easy to set up. We went from zero to sending 50k emails in a single afternoon. The deliverability is incredible.",
    },
    {
        id: 3,
        name: "Jessica Moore",
        role: "Head of Operations",
        company: "Align Ventures",
        avatarSeed: "jessica",
        quote:
            "BulkMailer completely changed how we run outreach as a team. It's fast, intuitive, and fits right into our workflow — no learning curve, just results.",
    },
    {
        id: 4,
        name: "Marcus Lee",
        role: "Founder",
        company: "LaunchPad HQ",
        avatarSeed: "marcus",
        quote:
            "I've tried every email tool out there. Nothing comes close to BulkMailer for reliability, speed, and the quality of inbox placement. It's a game-changer.",
    },
];

// DiceBear illustrated avatars (avataaars style - mimics cartoon portraits)
function avatarUrl(seed: string) {
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`;
}

export default function Testimonials() {
    const [activeId, setActiveId] = useState(0);
    const [fading, setFading] = useState(false);

    const active = testimonials[activeId];

    const handleSelect = (id: number) => {
        if (id === activeId) return;
        setFading(true);
        setTimeout(() => {
            setActiveId(id);
            setFading(false);
        }, 180);
    };

    return (
        <section className="py-24 px-6 bg-white">
            <div className="max-w-6xl mx-auto">

                {/* Main two-column layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

                    {/* Left: Heading */}
                    <div className="lg:pt-4">
                        <FadeIn direction="up">
                            <h2
                                className="font-black text-gray-900 leading-tight"
                                style={{
                                    fontSize: "clamp(36px, 5vw, 64px)",
                                    letterSpacing: "-0.03em",
                                }}
                            >
                                Loved by marketers &amp;
                                <br />
                                teams
                            </h2>
                        </FadeIn>
                    </div>

                    {/* Right: Avatars + Quote */}
                    <FadeIn delay={0.2} direction="left" className="w-full">
                        <div>
                            {/* Avatar row — clickable rounded squares */}
                            <div className="flex items-center gap-2 mb-6">
                                {testimonials.map((t) => {
                                    const isActive = t.id === activeId;
                                    return (
                                        <button
                                            key={t.id}
                                            onClick={() => handleSelect(t.id)}
                                            className="relative rounded-2xl overflow-hidden flex-shrink-0 transition-all duration-200"
                                            style={{
                                                width: "52px",
                                                height: "52px",
                                                outline: isActive
                                                    ? "2.5px solid #5235EF"
                                                    : "2.5px solid transparent",
                                                outlineOffset: "2px",
                                                opacity: isActive ? 1 : 0.55,
                                                transform: isActive ? "scale(1.08)" : "scale(1)",
                                                background: "#f0f0f0",
                                            }}
                                            aria-label={`View ${t.name}'s testimonial`}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={avatarUrl(t.avatarSeed)}
                                                alt={t.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Quote — fades on switch */}
                            <div
                                style={{
                                    opacity: fading ? 0 : 1,
                                    transition: "opacity 180ms ease",
                                }}
                            >
                                <blockquote
                                    className="text-gray-900 font-semibold leading-relaxed mb-4"
                                    style={{ fontSize: "clamp(14px, 1.3vw, 16px)" }}
                                >
                                    &ldquo;{active.quote}&rdquo;
                                </blockquote>

                                <p className="text-sm font-semibold">
                                    <span className="text-gray-700">{active.name}, {active.role}, </span>
                                    <span style={{ color: "#5235EF" }}>{active.company}</span>
                                </p>
                            </div>
                        </div>
                    </FadeIn>
                </div>

            </div>
        </section>
    );
}
