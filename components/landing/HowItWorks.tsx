"use client";

const steps = [
    {
        num: "01",
        title: "Start your project",
        desc: "Create an account, connect your SMTP provider, and import your contact list with a single CSV upload.",
    },
    {
        num: "02",
        title: "Design with ease",
        desc: "Use our intuitive drag-and-drop editor, smart tools and stunning designs.",
    },
    {
        num: "03",
        title: "Export & Share",
        desc: "Easily integrate with your favorite tools to launch your project effortlessly.",
    },
];

export default function HowItWorks() {
    return (
        <section className="py-24 px-6 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

                    {/* Left Side: Content */}
                    <div className="max-w-md">
                        <h2 className="text-5xl font-black text-gray-900 mb-16 tracking-tighter leading-[1.1]">
                            Simplify your <br /> workflow
                        </h2>

                        <div className="space-y-12">
                            {steps.map((step) => (
                                <div key={step.num} className="flex gap-8 group">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-sm font-bold text-gray-400 border border-gray-100 group-hover:border-purple-200 group-hover:text-purple-600 transition-colors">
                                        {step.num}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {step.title}
                                        </h3>
                                        <p className="text-gray-500 text-[15px] leading-relaxed">
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Side: Image Mockup */}
                    <div className="relative">
                        {/* Outer Light Grey Background Container */}
                        <div className="bg-[#f0f2f6] rounded-[30px] p-8 md:p-12 lg:p-16">

                            {/* Inner Card - This is where your image goes */}
                            <div className="bg-white rounded-[30px] shadow-[0_32px_64px_-12px_rgba(124,58,237,0.3)] border border-gray-100 overflow-hidden transform scale-[1.02]">
                                <div className="relative h-full w-full">
                                    <img
                                        src="/images/app-mockup.avif" // REPLACE WITH YOUR IMAGE
                                        alt="Platform Interface"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Available platforms text below the container */}
                        <div className="mt-10 flex items-center justify-center gap-2">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                Available on Windows & Mac
                            </span>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}