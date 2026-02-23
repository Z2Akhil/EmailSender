"use client";

export default function DarkFeatures() {
    return (
        <section className="py-24 px-6 mx-20 rounded-[48px]" style={{ background: "#111111" }}>
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2
                        className="font-black text-white mb-4"
                        style={{ fontSize: "clamp(28px,4vw,48px)", letterSpacing: "-0.03em" }}
                    >
                        Power up your workflow with{" "}
                        <span
                            style={{
                                background: "linear-gradient(135deg,#7C3AED,#A855F7,#EC4899)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            next-gen features
                        </span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Card 1 */}
                    <div
                        className="rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-1 cursor-default"
                        style={{ background: "#1A1A1A", borderColor: "#2A2A2A" }}
                        onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLDivElement).style.borderColor = "#3A3A3A")
                        }
                        onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLDivElement).style.borderColor = "#2A2A2A")
                        }
                    >
                        <div className="text-5xl mb-4">☁️</div>
                        <h3 className="text-lg font-bold text-white mb-2">Cloud-based accessibility</h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Access your campaigns anytime, anywhere — no downloads needed. Fully
                            browser-based and always in sync across your team.
                        </p>
                        <div className="mt-6 flex gap-2">
                            {["Emily B.", "Mark W."].map((name, i) => (
                                <span
                                    key={name}
                                    className="text-xs font-semibold px-3 py-1 rounded-full text-white"
                                    style={{
                                        background:
                                            i === 0 ? "rgba(124,58,237,0.3)" : "rgba(59,130,246,0.3)",
                                        border: `1px solid ${i === 0 ? "rgba(124,58,237,0.4)" : "rgba(59,130,246,0.4)"}`,
                                    }}
                                >
                                    {name}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Card 2 */}
                    <div
                        className="rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-1 cursor-default"
                        style={{ background: "#1A1A1A", borderColor: "#2A2A2A" }}
                        onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLDivElement).style.borderColor = "#3A3A3A")
                        }
                        onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLDivElement).style.borderColor = "#2A2A2A")
                        }
                    >
                        <div className="text-5xl mb-4">⚡</div>
                        <h3 className="text-lg font-bold text-white mb-2">
                            Fast &amp; secure performance
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Lightning-fast email delivery with enterprise-level security, GDPR compliance,
                            and end-to-end encryption.
                        </p>
                        <div className="mt-6 flex items-center gap-2 text-xs text-gray-400">
                            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                            99.9% uptime SLA
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
