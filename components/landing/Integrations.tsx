"use client";

import { FadeIn, FadeInStagger, FadeInStaggerItem } from "@/components/animations/FadeIn";

export default function Integrations() {
    return (
        <section className="py-24 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

                    {/* Left Side: Visual Integration Flow */}
                    <FadeIn direction="up">
                        <div className="relative bg-[#f0f2f6] rounded-[48px] p-12 lg:p-20 flex flex-col items-center">

                            {/* Integration Icons Grid (Mocking the image icons) */}
                            <FadeInStagger className="grid grid-cols-5 gap-4 mb-12 relative z-10" faster>
                                {[...Array(10)].map((_, i) => (
                                    <FadeInStaggerItem
                                        key={i}
                                        direction="up"
                                        className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center overflow-hidden"
                                    >
                                        {/* These would be your integration logos */}
                                        <div className="w-8 h-8 bg-gray-50 rounded-lg animate-pulse" />
                                    </FadeInStaggerItem>
                                ))}
                            </FadeInStagger>

                            {/* Connection Lines SVG */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-20">
                                    <path d="M100 150C100 250 180 300 200 320" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" />
                                    <path d="M150 150C150 250 190 300 200 320" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" />
                                    <path d="M200 150V320" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" />
                                    <path d="M250 150C250 250 210 300 200 320" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" />
                                    <path d="M300 150C300 250 220 300 200 320" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" />
                                </svg>
                            </div>

                            {/* Central Logo - Replace src with your provided image */}
                            <div className="relative z-10 mt-4">
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-[28px] shadow-[0_20px_50px_rgba(124,58,237,0.3)] border border-purple-100 flex items-center justify-center overflow-hidden">
                                    <img
                                        src="/your-main-logo.png"
                                        alt="Central Platform"
                                        className="w-full h-full object-cover p-4"
                                    />
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    {/* Right Side: Content */}
                    <div className="max-w-lg">
                        <FadeIn direction="up">
                            <h2 className="text-5xl font-black text-gray-900 mb-8 tracking-tighter leading-[1.1]">
                                One platform, unlimited <br /> integrations
                            </h2>
                        </FadeIn>

                        <FadeIn delay={0.2} direction="up">
                            <button className="bg-[#111111] text-white px-8 py-3.5 rounded-full font-bold text-sm shadow-[0_10px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.2)] transition-all mb-12">
                                View all integrations
                            </button>
                        </FadeIn>

                        <FadeIn delay={0.4} direction="up">
                            <div className="space-y-6">
                                <p className="text-gray-500 text-lg font-medium leading-relaxed italic">
                                    “Our platform empowers teams to collaborate, innovate, and bring ideas to life—seamlessly and effortlessly.”
                                </p>

                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-100">
                                        <img
                                            src="/avatar.jpg"
                                            alt="Daniel Vaughn"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-900">Daniel Vaughn</div>
                                        <div className="text-xs text-gray-400 font-semibold">Founder & CEO</div>
                                    </div>
                                </div>
                            </div>
                        </FadeIn>
                    </div>

                </div>
            </div>
        </section>
    );
}