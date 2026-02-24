"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/animations/FadeIn";

const audiences = [
    { label: "Email marketers", col: 0 },
    { label: "App & Web developers", col: 1 },
    { label: "Product teams", col: 0 },
    { label: "Marketing agencies", col: 1 },
    { label: "Enterprise organizations", col: 0 },
    { label: "Agencies & Startups", col: 1 },
];

const leftItems = audiences.filter((a) => a.col === 0);
const rightItems = audiences.filter((a) => a.col === 1);

export default function PerfectSolution() {
    return (
        <section className="py-24 px-6 bg-white">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* ── Left: App Mockup ── */}
                    <FadeIn direction="right">
                        <div
                            className="rounded-[32px] p-8 relative overflow-hidden"
                            style={{ background: "#f0f2f6" }}
                        >
                            {/* Mock dashboard card */}
                            <div
                                className="rounded-[24px] overflow-hidden shadow-2xl"
                                style={{ background: "#111111" }}
                            >
                                {/* Top bar */}
                                <div
                                    className="flex items-center justify-between px-5 py-3.5 border-b"
                                    style={{ borderColor: "#222" }}
                                >
                                    <span className="text-white text-sm font-extrabold tracking-tight">
                                        BulkMailer.
                                    </span>
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-white/20" />
                                        <div className="w-2 h-2 rounded-full bg-white/20" />
                                        <div className="w-2 h-2 rounded-full bg-white/20" />
                                    </div>
                                </div>

                                {/* Sub-heading */}
                                <div className="text-center text-white text-sm font-semibold py-3" style={{ background: "#161616" }}>
                                    Active campaigns
                                </div>

                                {/* Campaign rows */}
                                {[
                                    { name: "Black Friday Blast", sent: "12,400", rate: "42%" },
                                    { name: "Product Launch #3", sent: "8,750", rate: "38%" },
                                    { name: "Weekly Newsletter", sent: "21,000", rate: "55%" },
                                ].map((c, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-4 px-5 py-3.5 border-b"
                                        style={{ borderColor: "#1e1e1e", background: i % 2 === 0 ? "#111" : "#131313" }}
                                    >
                                        <div
                                            className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                                            style={{ background: ["#5235EF", "#7C3AED", "#A855F7"][i] }}
                                        >
                                            {c.name[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-white text-sm font-semibold truncate">{c.name}</div>
                                            <div className="text-gray-500 text-xs">{c.sent} sent</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold" style={{ color: "#10B981" }}>{c.rate}</div>
                                            <div className="text-gray-600 text-xs">open rate</div>
                                        </div>
                                    </div>
                                ))}

                                <div className="px-5 py-3 text-gray-600 text-xs">
                                    3 of 12 campaigns shown
                                </div>
                            </div>

                            {/* Floating stats card */}
                            <div
                                className="absolute bottom-12 -right-4 rounded-2xl px-4 py-3 shadow-xl border"
                                style={{
                                    background: "white",
                                    borderColor: "#E5E7EB",
                                    minWidth: "150px",
                                }}
                            >
                                <div className="text-xs text-gray-400 mb-1 font-medium">Delivery rate</div>
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1">
                                        {["#5235EF", "#7C3AED", "#A855F7", "#EC4899", "#10B981"].map((c, i) => (
                                            <div key={i} className="w-4 h-4 rounded-full" style={{ background: c }} />
                                        ))}
                                    </div>
                                </div>
                                <div className="text-xs font-bold text-gray-900 mt-1">99.1% inbox</div>
                            </div>
                        </div>
                    </FadeIn>

                    {/* ── Right: Text + Feature list ── */}
                    <FadeIn delay={0.2} direction="left">
                        <div>
                            <h2
                                className="font-black text-gray-900 mb-5 leading-tight"
                                style={{
                                    fontSize: "clamp(28px, 4vw, 50px)",
                                    letterSpacing: "-0.03em",
                                }}
                            >
                                The perfect email solution{" "}
                                <br className="hidden md:block" />
                                for every workflow
                            </h2>

                            <p className="text-gray-500 text-base leading-relaxed mb-8 max-w-md">
                                Discover how BulkMailer{" "}
                                <span className="font-semibold text-gray-700">fits your needs</span>,
                                whether you&apos;re a freelancer,{" "}
                                <span className="font-semibold text-gray-700">startup</span>, or{" "}
                                <span className="font-semibold text-gray-700">enterprise</span>.
                            </p>

                            {/* Two-column audience list */}
                            <FadeInStagger className="grid grid-cols-2 gap-x-8 gap-y-4 mb-10" faster>
                                {[leftItems, rightItems].map((col, ci) => (
                                    <div key={ci} className="space-y-4">
                                        {col.map((item) => (
                                            <FadeInStaggerItem key={item.label} direction="left" className="flex items-center gap-2.5">
                                                <ArrowRight
                                                    className="w-4 h-4 flex-shrink-0"
                                                    style={{ color: "#5235EF" }}
                                                />
                                                <span
                                                    className="text-sm font-semibold"
                                                    style={{ color: "#374151" }}
                                                >
                                                    {item.label}
                                                </span>
                                            </FadeInStaggerItem>
                                        ))}
                                    </div>
                                ))}
                            </FadeInStagger>

                            <Link
                                href="/signup"
                                className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-full text-white transition-all hover:opacity-90"
                                style={{ background: "#5235EF" }}
                            >
                                Get started free
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </FadeIn>

                </div>
            </div>
        </section>
    );
}
