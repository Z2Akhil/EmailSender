"use client";


import Link from "next/link";
import { Mail } from "lucide-react";


const navLinks = ["Features", "Pricing", "Blog", "Contact"];

export default function Navbar() {
    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50"
            style={{
                background: "rgba(255,255,255,0.85)",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                borderBottom: "1px solid #F3F4F6",
            }}
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-10">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}
                        >
                            <Mail className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-extrabold text-gray-900 tracking-tight">
                            BulkMailer
                        </span>
                    </div>

                    {/* Center nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link}
                                href={`#${link.toLowerCase()}`}
                                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                {link}
                            </a>
                        ))}
                    </div>

                    {/* Login pill */}
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-full transition-all"
                        style={{ background: "#111111" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#333")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#111111")}
                    >
                        Login now
                    </Link>
                </div>
            </div>
        </nav>
    );
}
