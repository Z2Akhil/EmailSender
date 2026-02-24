"use client";

import { Mail } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";

const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Download", href: "#" },
];

const allPages = [
    { label: "Power-Ups", href: "#", badge: true },
    { label: "About us", href: "#" },
    { label: "Contact us", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Waitlist", href: "#" },
    { label: "Changelog", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "404", href: "#" },
];

// Inline SVG paths for social icons
const socials = [
    {
        label: "Facebook",
        viewBox: "0 0 24 24",
        path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
    },
    {
        label: "X",
        viewBox: "0 0 24 24",
        // X (Twitter) modern logo shape using polyline
        path: "M4 4l16 16M4 20 20 4",
    },
    {
        label: "TikTok",
        viewBox: "0 0 24 24",
        path: "M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5",
    },
    {
        label: "LinkedIn",
        viewBox: "0 0 24 24",
        path: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    },
    {
        label: "YouTube",
        viewBox: "0 0 24 24",
        path: "M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.95C5.12 20 12 20 12 20s6.88 0 8.59-.47a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02l5.75-3.02-5.75-3.02v6.04z",
    },
];

const hoverWhite = (e: React.MouseEvent<HTMLElement>) =>
    ((e.currentTarget as HTMLElement).style.color = "#ffffff");
const resetGray = (e: React.MouseEvent<HTMLElement>) =>
    ((e.currentTarget as HTMLElement).style.color = "#9CA3AF");

export default function Footer() {
    return (
        <footer className="px-6 pt-16 pb-0" style={{ background: "#171717" }}>
            <div className="max-w-6xl mx-auto">

                {/* Main grid: wide brand left | quick links | all pages */}
                <FadeIn direction="up">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-10 mb-16">

                        {/* Brand + social */}
                        <div className="flex flex-col justify-between min-h-[220px]">
                            {/* Logo */}
                            <div className="flex items-center gap-2">
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

                            {/* Social icons pinned to bottom of column */}
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">
                                    Follow us on:
                                </p>
                                <div className="flex items-center gap-4">
                                    {socials.map((s) => (
                                        <a
                                            key={s.label}
                                            href="#"
                                            aria-label={s.label}
                                            className="transition-colors"
                                            style={{ color: "#6B7280" }}
                                            onMouseEnter={hoverWhite}
                                            onMouseLeave={resetGray}
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox={s.viewBox}
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="w-5 h-5"
                                            >
                                                <path d={s.path} />
                                            </svg>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className="min-w-[140px]">
                            <p className="text-sm font-bold text-white mb-5">Quick Links</p>
                            <ul className="space-y-3.5">
                                {quickLinks.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            className="text-sm transition-colors"
                                            style={{ color: "#9CA3AF" }}
                                            onMouseEnter={hoverWhite}
                                            onMouseLeave={resetGray}
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* All Pages */}
                        <div className="min-w-[160px]">
                            <p className="text-sm font-bold text-white mb-5">All Pages</p>
                            <ul className="space-y-3.5">
                                {allPages.map((page) => (
                                    <li key={page.label} className="flex items-center gap-2">
                                        <a
                                            href={page.href}
                                            className="text-sm transition-colors"
                                            style={{ color: "#9CA3AF" }}
                                            onMouseEnter={hoverWhite}
                                            onMouseLeave={resetGray}
                                        >
                                            {page.label}
                                        </a>
                                        {page.badge && (
                                            <span
                                                className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                                                style={{ background: "#5235EF" }}
                                            >
                                                New
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </FadeIn>

                {/* Bottom bar */}
                <FadeIn delay={0.2} direction="up">
                    <div
                        className="border-t py-5 text-center"
                        style={{ borderColor: "rgba(255,255,255,0.07)" }}
                    >
                        <p className="text-xs" style={{ color: "#4B5563" }}>
                            Designed by{" "}
                            <span className="font-bold text-gray-400">BulkMailer</span>
                            . Powered by{" "}
                            <span className="font-bold text-gray-400">Next.js</span>
                        </p>
                    </div>
                </FadeIn>
            </div>
        </footer>
    );
}
