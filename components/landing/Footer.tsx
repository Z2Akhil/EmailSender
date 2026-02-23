"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

const quickLinks = ["Home", "Features", "Pricing", "Download"];
const allPages = [
    { label: "Templates", badge: true },
    { label: "About us" },
    { label: "Contact us" },
    { label: "Blog" },
    { label: "Privacy Policy" },
];

// Social icon SVGs (inline, avoids additional icon package dependency)
const socials = [
    {
        label: "Facebook",
        path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
    },
    {
        label: "X / Twitter",
        path: "M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z",
    },
    {
        label: "Instagram",
        path: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z M17.5 6.5h.01 M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9A5.5 5.5 0 0 1 16.5 22h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2z",
    },
    {
        label: "LinkedIn",
        path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z M2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    },
    {
        label: "YouTube",
        path: "M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z M9.75 15.02l5.75-3.02-5.75-3.02v6.04z",
    },
];

export default function Footer() {
    return (
        <footer className="py-16 px-6" style={{ background: "#111111" }}>
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                style={{ background: "linear-gradient(135deg,#7C3AED,#A855F7)" }}
                            >
                                <Mail className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-lg font-extrabold text-white tracking-tight">
                                BulkMailer
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                            The affordable, powerful email marketing platform for growing businesses.
                        </p>
                        <div className="mt-6">
                            <p className="text-xs text-gray-600 uppercase tracking-widest mb-3">
                                Follow us on:
                            </p>
                            <div className="flex gap-3">
                                {socials.map((s) => (
                                    <a
                                        key={s.label}
                                        href="#"
                                        aria-label={s.label}
                                        className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                                        style={{ background: "rgba(255,255,255,0.08)" }}
                                        onMouseEnter={(e) =>
                                        ((e.currentTarget as HTMLAnchorElement).style.background =
                                            "rgba(255,255,255,0.18)")
                                        }
                                        onMouseLeave={(e) =>
                                        ((e.currentTarget as HTMLAnchorElement).style.background =
                                            "rgba(255,255,255,0.08)")
                                        }
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="white"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="w-4 h-4"
                                        >
                                            <path d={s.path} />
                                        </svg>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <p className="text-sm font-bold text-white mb-4">Quick Links</p>
                        <ul className="space-y-3">
                            {quickLinks.map((link) => (
                                <li key={link}>
                                    <a
                                        href={`#${link.toLowerCase()}`}
                                        className="text-sm text-gray-400 hover:text-white transition-colors"
                                    >
                                        {link}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* All Pages */}
                    <div>
                        <p className="text-sm font-bold text-white mb-4">All Pages</p>
                        <ul className="space-y-3">
                            {allPages.map((page) => (
                                <li key={page.label} className="flex items-center gap-2">
                                    <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                                        {page.label}
                                    </a>
                                    {page.badge && (
                                        <span
                                            className="text-xs font-bold px-1.5 py-0.5 rounded text-white"
                                            style={{ background: "#7C3AED" }}
                                        >
                                            New
                                        </span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div
                    className="border-t pt-8 text-center"
                    style={{ borderColor: "rgba(255,255,255,0.08)" }}
                >
                    <p className="text-xs text-gray-600">
                        © {new Date().getFullYear()} BulkMailer. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
