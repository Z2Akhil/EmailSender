const testimonials = [
    {
        quote:
            "This tool has completely transformed how our team manages email campaigns. The real-time analytics and seamless integrations make our process so much smoother!",
        name: "Emily Ray",
        role: "UX Designer",
        initials: "ER",
        gradient: "linear-gradient(135deg,#7C3AED,#EC4899)",
    },
    {
        quote:
            "BulkMailer is ridiculously easy to set up. We went from zero to sending 50k emails in a single afternoon. The deliverability is incredible.",
        name: "James Kim",
        role: "Growth Lead",
        initials: "JK",
        gradient: "linear-gradient(135deg,#3B82F6,#06B6D4)",
    },
];

const avatarInitials = ["ER", "JK", "ML", "SR", "TW"];
const avatarColors = ["#7C3AED", "#3B82F6", "#10B981", "#F59E0B", "#EC4899"];

export default function Testimonials() {
    return (
        <section className="py-24 px-6 bg-white">
            <div className="max-w-4xl mx-auto text-center">
                {/* Overlapping avatars */}
                <div className="flex justify-center mb-6">
                    {avatarInitials.map((init, i) => (
                        <div
                            key={init}
                            className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                            style={{
                                background: avatarColors[i],
                                marginLeft: i > 0 ? "-10px" : "0",
                                zIndex: 5 - i,
                            }}
                        >
                            {init}
                        </div>
                    ))}
                </div>

                {/* Main quote */}
                <blockquote
                    className="font-bold leading-tight text-gray-900 mb-8"
                    style={{ fontSize: "clamp(22px,3.5vw,36px)", letterSpacing: "-0.02em" }}
                >
                    &ldquo;{testimonials[0].quote}&rdquo;
                </blockquote>

                <div className="flex items-center justify-center gap-3">
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: testimonials[0].gradient }}
                    >
                        {testimonials[0].initials}
                    </div>
                    <div className="text-left">
                        <div className="text-sm font-bold text-gray-900">{testimonials[0].name}</div>
                        <div className="text-xs text-gray-400">{testimonials[0].role}</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
