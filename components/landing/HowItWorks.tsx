const steps = [
    {
        num: "01",
        title: "Set up your workspace",
        desc: "Create an account, connect your SMTP provider, and import your contact list with a single CSV upload.",
    },
    {
        num: "02",
        title: "Build your campaign",
        desc: "Use the drag-and-drop editor, choose from pre-built templates, and personalize every message at scale.",
    },
    {
        num: "03",
        title: "Send & analyse",
        desc: "Schedule or send instantly, then track opens, clicks, bounces, and unsubscribes in real-time.",
    },
];

const campaigns = [
    { name: "Summer Sale Newsletter", status: "Sent", open: "34%" },
    { name: "Product Launch Teaser", status: "Draft", open: "—" },
    { name: "Weekly Digest #12", status: "Scheduled", open: "—" },
];

const statusStyles: Record<string, { bg: string; color: string }> = {
    Sent: { bg: "#D1FAE5", color: "#065F46" },
    Draft: { bg: "#F3F4F6", color: "#6B7280" },
    Scheduled: { bg: "#EDE9FE", color: "#7C3AED" },
};

export default function HowItWorks() {
    return (
        <section className="py-24 px-6 bg-white">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">

                    {/* Steps */}
                    <div className="space-y-10">
                        {steps.map((step, i) => (
                            <div key={step.num} className="flex gap-6">
                                <div
                                    className="text-3xl font-black leading-none shrink-0 mt-1"
                                    style={{ color: i === 0 ? "#7C3AED" : "#E5E7EB" }}
                                >
                                    {step.num}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                                    <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* App mockup */}
                    <div
                        className="rounded-3xl shadow-2xl overflow-hidden border"
                        style={{ borderColor: "#E5E7EB" }}
                    >
                        {/* Window chrome */}
                        <div
                            className="px-5 py-3 flex items-center gap-2 border-b"
                            style={{ background: "#FAFAFA", borderColor: "#F0F0F0" }}
                        >
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                            <span className="mx-auto text-xs text-gray-400 font-medium">
                                BulkMailer · Campaigns
                            </span>
                        </div>
                        {/* Content */}
                        <div className="p-6" style={{ background: "#FAFAFA" }}>
                            <div
                                className="bg-white rounded-2xl p-5 border shadow-sm"
                                style={{ borderColor: "#F0F0F0" }}
                            >
                                <div
                                    className="text-sm font-bold mb-4 px-3 py-1.5 rounded-xl text-white inline-block"
                                    style={{ background: "#7C3AED" }}
                                >
                                    Welcome back, Mike! 👋
                                </div>
                                <div className="space-y-3 mt-2">
                                    {campaigns.map((c) => (
                                        <div
                                            key={c.name}
                                            className="flex items-center justify-between px-4 py-3 rounded-xl border"
                                            style={{ borderColor: "#F0F0F0" }}
                                        >
                                            <div>
                                                <div className="text-sm font-semibold text-gray-800">{c.name}</div>
                                                <div className="text-xs text-gray-400 mt-0.5">Open rate: {c.open}</div>
                                            </div>
                                            <span
                                                className="text-xs font-semibold px-3 py-1 rounded-full"
                                                style={statusStyles[c.status]}
                                            >
                                                {c.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <p className="text-center mt-4 text-xs text-gray-400">Available on Web &amp; Desktop</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
