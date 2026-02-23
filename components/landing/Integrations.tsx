const integrations = [
    { emoji: "⚡", label: "SendGrid" },
    { emoji: "📧", label: "SES" },
    { emoji: "🔔", label: "Slack" },
    { emoji: "📊", label: "Analytics" },
    { emoji: "🔗", label: "Zapier" },
    { emoji: "☁️", label: "AWS" },
    { emoji: "🔒", label: "Security" },
    { emoji: "📱", label: "Webhooks" },
];

export default function Integrations() {
    return (
        <section className="py-24 px-6" style={{ background: "#F9FAFB" }}>
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

                    {/* Integration icon grid */}
                    <div>
                        <div className="grid grid-cols-4 gap-4 mb-8">
                            {integrations.map((int) => (
                                <div
                                    key={int.label}
                                    title={int.label}
                                    className="aspect-square bg-white border rounded-2xl flex items-center justify-center text-2xl shadow-sm cursor-default transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                                    style={{ borderColor: "#E5E7EB" }}
                                >
                                    {int.emoji}
                                </div>
                            ))}
                        </div>
                        <button
                            className="inline-flex items-center gap-2 font-semibold text-sm text-white px-5 py-3 rounded-full transition-all"
                            style={{ background: "#111111" }}
                        >
                            View all integrations
                        </button>
                    </div>

                    {/* Testimonial quote */}
                    <div>
                        <blockquote className="text-xl font-semibold leading-relaxed text-gray-800 mb-6">
                            &ldquo;BulkMailer completely transformed how our team sends campaigns. The
                            real-time analytics and seamless integrations make our process so much
                            smoother!&rdquo;
                        </blockquote>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                style={{ background: "linear-gradient(135deg,#7C3AED,#EC4899)" }}
                            >
                                DV
                            </div>
                            <div>
                                <div className="text-sm font-bold text-gray-900">Daniel Vaughn</div>
                                <div className="text-xs text-gray-400">Founder &amp; CEO</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
