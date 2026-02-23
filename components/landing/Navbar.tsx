"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, Menu, X } from "lucide-react";

const navLinks = ["Features", "Pricing", "Blog", "Contact"];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY;
            setHidden(y > 60);
            setScrolled(y > 10);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            {/* Overlay */}
            <div
                onClick={() => setIsOpen(false)}
                className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden transition-opacity duration-500 ${isOpen
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                    }`}
            />

            <nav
                className="fixed top-0 left-0 right-0 z-50"
                style={{
                    background: scrolled
                        ? "rgba(255,255,255,0.95)"
                        : "linear-gradient(180deg, #ffffff 0%, #ffffff 50%, rgba(255,255,255,0) 100%)",
                    backdropFilter: "blur(16px)",
                    WebkitBackdropFilter: "blur(16px)",
                    transform: hidden ? "translateY(-100%)" : "translateY(0)",
                    transition: "transform 500ms cubic-bezier(0.4,0,0.2,1), background 400ms ease",
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

                        {/* Desktop Nav */}
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

                        {/* Desktop Login */}
                        <Link
                            href="/login"
                            className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-full transition-all"
                            style={{ background: "#111111" }}
                        >
                            Login now
                        </Link>

                        {/* Mobile Hamburger */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden"
                        >
                            {isOpen ? (
                                <X className="w-6 h-6 text-gray-900" />
                            ) : (
                                <Menu className="w-6 h-6 text-gray-900" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown */}
                <div
                    className={`md:hidden absolute top-16 left-0 right-0 bg-white shadow-lg transition-all duration-500 ease-in-out transform ${isOpen
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 -translate-y-4 pointer-events-none"
                        }`}
                >
                    <div className="flex flex-col p-6 gap-6">
                        {navLinks.map((link) => (
                            <a
                                key={link}
                                href={`#${link.toLowerCase()}`}
                                className="text-sm font-medium text-gray-700"
                                onClick={() => setIsOpen(false)}
                            >
                                {link}
                            </a>
                        ))}

                        <Link
                            href="/login"
                            className="text-center text-sm font-semibold text-white px-5 py-3 rounded-full"
                            style={{ background: "#111111" }}
                            onClick={() => setIsOpen(false)}
                        >
                            Login now
                        </Link>
                    </div>
                </div>
            </nav>
        </>
    );
}
