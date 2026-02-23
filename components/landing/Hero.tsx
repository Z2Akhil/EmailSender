import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function Hero() {
    return (
        <section
            className="pt-32 pb-24 px-6 overflow-hidden"
            style={{
                background: "linear-gradient(180deg, #ffffff 0%, #f0f2f6 4%, #8771ff4d 24.3243%, #8771ff4d 78.8288%, #ffffff 100%)",
            }}
        >
            {/* ── Text content ── */}
            <div className="max-w-4xl mx-auto text-center">
                {/* Heading */}
                <h1
                    className="font-bold leading-tight mb-6"
                    style={{
                        fontSize: "clamp(40px, 6vw, 72px)",
                        letterSpacing: "-0.02em",
                        color: "#1A1A1A", // Darker, cleaner text
                    }}
                >
                    Bring ideas to life in <br />
                    <span style={{ color: "#1A1A1A" }}>just a few clicks.</span>
                </h1>

                {/* Sub-text */}
                <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Design, prototype, and collaborate in real-time - all in one powerful platform.
                    Elevate your <span className="font-bold text-gray-800">creative process</span> with
                    <span className="font-bold text-gray-800"> seamless teamwork</span> and limitless possibilities.
                </p>

                {/* CTA */}
                <Link
                    href="/get-started"
                    className="inline-flex items-center gap-3 font-semibold text-white px-8 py-4 rounded-full transition-all hover:opacity-90"
                    style={{
                        background: "#635BFF", // The specific purple from the "Get Started" button
                        fontSize: "16px",
                    }}
                >
                    Get Started • it&apos;s free
                    <span
                        className="w-6 h-6 rounded-full flex items-center justify-center bg-white/20"
                    >
                        <ArrowRight className="w-4 h-4 text-white" />
                    </span>
                </Link>
            </div>

            {/* ── Image Section (Replacing Mockup) ── */}
            <div className="max-w-6xl mx-auto mt-20">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

                    {/* Large Main Image (Left) */}
                    <div className="md:col-span-8 rounded-3xl overflow-hidden shadow-2xl border border-white/50 bg-white">
                        <Image
                            src="/images/hero-main.png" // Replace with your image path
                            alt="Main Interface"
                            width={1200}
                            height={800}
                            className="w-full h-auto object-cover"
                        />
                    </div>

                    {/* Smaller Feature Image (Right) */}
                    <div className="md:col-span-4 rounded-3xl overflow-hidden shadow-2xl border border-white/50 bg-white">
                        <Image
                            src="/images/hero-feature.png" // Replace with your image path
                            alt="Feature Preview"
                            width={600}
                            height={800}
                            className="w-full h-auto object-cover"
                        />
                    </div>

                </div>
            </div>
        </section>
    );
}