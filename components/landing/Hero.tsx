import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Hero() {
    return (
        <section
            className="pt-32 pb-0 px-6 overflow-hidden"
            style={{
                background:
                    "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 15% 60%, rgba(167,139,250,0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 85% 60%, rgba(196,181,253,0.12) 0%, transparent 60%), #ffffff",
            }}
        >
            <div className="max-w-4xl mx-auto text-center">
                {/* Badge */}
                <div
                    className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-1.5 rounded-full mb-8"
                    style={{
                        background: "rgba(124,58,237,0.08)",
                        color: "#7C3AED",
                        border: "1px solid rgba(124,58,237,0.15)",
                    }}
                >
                    <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: "#7C3AED" }}
                    >
                        New
                    </span>
                    Revolutionize your email workflow
                </div>

                {/* Heading */}
                <h1
                    className="font-black leading-none mb-6"
                    style={{
                        fontSize: "clamp(48px, 7vw, 80px)",
                        letterSpacing: "-0.04em",
                        color: "#111111",
                    }}
                >
                    Send smarter emails{" "}
                    <br />
                    <span
                        style={{
                            background: "linear-gradient(135deg,#7C3AED 0%,#A855F7 50%,#EC4899 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        in just a few clicks.
                    </span>
                </h1>

                {/* Sub-text */}
                <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
                    Manage contacts, build campaigns, and reach thousands of inboxes — all in one{" "}
                    <strong className="text-gray-700 font-semibold">powerful platform</strong> built
                    for growing businesses.
                </p>

                {/* CTA */}
                <Link
                    href="/signup"
                    className="inline-flex items-center gap-3 font-semibold text-white px-7 py-4 rounded-full transition-all"
                    style={{
                        background: "#7C3AED",
                        fontSize: "15px",
                        boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
                    }}
                >
                    Get Started • it&apos;s free
                    <span
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(255,255,255,0.25)" }}
                    >
                        <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                </Link>

                <p className="mt-4 text-sm text-gray-400">
                    No credit card required · 1,000 emails / month free
                </p>
            </div>
        </section>
    );
}
