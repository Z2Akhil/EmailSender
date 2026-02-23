export default function DashboardMockup() {
    const stats = [
        { label: "Emails Sent", value: "248K", color: "#7C3AED" },
        { label: "Open Rate", value: "31.4%", color: "#10B981" },
        { label: "Click Rate", value: "8.2%", color: "#F59E0B" },
        { label: "Contacts", value: "12.4K", color: "#3B82F6" },
    ];

    const bars = [40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 88];

    const toolbar = ["B", "I", "≡", "⊞", "◻", "⌫"];

    return (
        <section className="px-6 pb-24" style={{ background: "transparent" }}>
            <div className="max-w-6xl mx-auto mt-16">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* Card 1 — Stats */}
                    <div
                        className="bg-white rounded-3xl shadow-xl p-6 border"
                        style={{ borderColor: "#E5E7EB" }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400" />
                                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                <div className="w-3 h-3 rounded-full bg-green-400" />
                            </div>
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                                Live Dashboard
                            </span>
                        </div>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                            Campaign Overview
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {stats.map((s) => (
                                <div
                                    key={s.label}
                                    className="rounded-2xl p-4 border"
                                    style={{ background: "#FAFAFA", borderColor: "#F0F0F0" }}
                                >
                                    <div className="text-2xl font-black" style={{ color: s.color }}>
                                        {s.value}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">{s.label}</div>
                                </div>
                            ))}
                        </div>
                        {/* Mini bar chart */}
                        <div className="flex items-end gap-1.5 h-14">
                            {bars.map((h, i) => (
                                <div
                                    key={i}
                                    className="flex-1 rounded-t-md"
                                    style={{
                                        height: `${h}%`,
                                        background: i === 10 ? "#7C3AED" : "#EDE9FE",
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Card 2 — Builder preview */}
                    <div
                        className="bg-white rounded-3xl shadow-xl p-6 border"
                        style={{ borderColor: "#E5E7EB" }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-bold text-gray-900">Campaign Builder</span>
                            <span
                                className="text-xs font-semibold px-3 py-1 rounded-full text-white"
                                style={{ background: "#7C3AED" }}
                            >
                                Share
                            </span>
                        </div>
                        {/* Email preview */}
                        <div
                            className="rounded-2xl p-5 mb-4"
                            style={{ background: "linear-gradient(135deg,#F5F3FF,#EDE9FE)" }}
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                    BM
                                </div>
                                <div>
                                    <div className="text-xs font-semibold text-gray-800">BulkMailer Team</div>
                                    <div className="text-xs text-gray-500">noreply@bulkmailer.io</div>
                                </div>
                            </div>
                            <div className="text-sm font-bold text-gray-900 mb-1">
                                Welcome back, {`{{first_name}}`}!
                            </div>
                            <div className="text-xs text-gray-500 leading-relaxed">
                                Your campaign is ready to send. Click below to review and launch.
                            </div>
                            <div
                                className="mt-3 text-xs font-semibold text-white px-4 py-2 rounded-full inline-block"
                                style={{ background: "#7C3AED" }}
                            >
                                View Campaign →
                            </div>
                        </div>
                        {/* Toolbar */}
                        <div className="flex items-center gap-3">
                            {toolbar.map((icon) => (
                                <button
                                    key={icon}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-100 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
