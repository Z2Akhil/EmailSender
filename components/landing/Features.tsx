"use client";

const features = [
    {
        emoji: "📋",
        bg: "#F5F3FF",
        title: "Contact Management",
        description:
            "Upload CSV/Excel files, organize contacts into lists, and manage unsubscribes automatically.",
    },
    {
        emoji: "✉️",
        bg: "#EFF6FF",
        title: "Campaign Builder",
        description:
            "Design beautiful emails with pre-built templates and personalization tags like {{first_name}}.",
    },
    {
        emoji: "🤝",
        bg: "#FDF2F8",
        title: "Real-time Collaboration",
        description:
            "Work seamlessly with your team, share campaigns, and get instant feedback — all in one platform.",
    },
];

export default function Features() {
    return (
        <section id="features" className="py-24 px-6" style={{ background: "#F9FAFB" }}>
            <div className="max-w-6xl mx-auto">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((f) => (
                        <div
                            key={f.title}
                            className="bg-white border rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1 cursor-default"
                            style={{ borderColor: "#E5E7EB" }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLDivElement).style.borderColor = "#DDD6FE";
                                (e.currentTarget as HTMLDivElement).style.boxShadow =
                                    "0 8px 40px rgba(124,58,237,0.08)";
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLDivElement).style.borderColor = "#E5E7EB";
                                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                            }}
                        >
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5"
                                style={{ background: f.bg }}
                            >
                                {f.emoji}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
