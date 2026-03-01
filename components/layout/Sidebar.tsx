"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Mail,
    FileText,
    Settings,
    Zap,
    X,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/store";
import { useEffect } from "react";

const navItems = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Contacts",
        href: "/dashboard/contacts",
        icon: Users,
    },
    {
        label: "Campaigns",
        href: "/dashboard/campaigns",
        icon: Mail,
    },
    {
        label: "Templates",
        href: "/dashboard/templates",
        icon: FileText,
    },
    {
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { isOpen, setIsOpen } = useSidebarStore();

    // Close sidebar on route change on mobile
    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth < 768) {
            setIsOpen(false);
        }
    }, [pathname, setIsOpen]);

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 transition-opacity md:hidden",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setIsOpen(false)}
            />

            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-100 flex flex-col h-full transform transition-all duration-300 ease-in-out flex-shrink-0",
                "md:relative md:translate-x-0",
                isOpen ? "translate-x-0 shadow-2xl md:shadow-none w-64 md:w-60" : "-translate-x-full w-64 md:w-[76px]"
            )}>
                {/* Logo and Header */}
                <div className={cn(
                    "p-4 sm:p-5 border-b border-gray-100 flex items-center h-16 min-h-[4rem]", // Fixed exactly perfectly to h-16 (64px) for alignment with Topbar
                    isOpen ? "justify-between" : "md:justify-center justify-between"
                )}>
                    {isOpen ? (
                        <>
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-2.5 overflow-hidden"
                                onClick={() => {
                                    if (typeof window !== "undefined" && window.innerWidth < 768) setIsOpen(false);
                                }}
                            >
                                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Zap className="w-4 h-4 text-white" />
                                </div>
                                <span className={cn(
                                    "text-lg font-bold text-gray-900 truncate transition-opacity",
                                    !isOpen && "md:hidden"
                                )}>BulkMailer</span>
                            </Link>

                            {/* Mobile Close / Desktop Toggle Button */}
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
                            >
                                <X className="w-5 h-5 md:hidden" />
                                <ChevronLeft className="w-5 h-5 hidden md:block" />
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsOpen(true)}
                            className="hidden md:flex w-8 h-8 items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            aria-label="Expand sidebar"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}

                    {/* Mobile Only Header Content When Closed (Just in case) */}
                    {!isOpen && (
                        <div className="md:hidden flex items-center justify-between w-full">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Zap className="w-4 h-4 text-white" />
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 -mr-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Close sidebar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-3 space-y-0.5">
                    {navItems.map((item) => {
                        const isActive =
                            item.href === "/dashboard"
                                ? pathname === "/dashboard"
                                : pathname.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={!isOpen ? item.label : undefined}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                                    !isOpen ? "md:justify-center justify-start" : "justify-start",
                                    isActive
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                                onClick={() => {
                                    if (typeof window !== "undefined" && window.innerWidth < 768) {
                                        setIsOpen(false);
                                    }
                                }}
                            >
                                <item.icon
                                    className={cn(
                                        "w-5 h-5 flex-shrink-0",
                                        isActive ? "text-blue-600" : "text-gray-400"
                                    )}
                                />
                                <span className={cn(
                                    "whitespace-nowrap transition-opacity",
                                    !isOpen && "md:hidden"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Upgrade CTA */}
                <div className={cn("p-4 sm:p-5", !isOpen && "md:hidden")}>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 shadow-sm">
                        <p className="text-sm font-semibold text-gray-900 mb-1">Free Plan</p>
                        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                            1,000 emails/month<br />500 contacts
                        </p>
                        <Link
                            href="/dashboard/settings?tab=billing"
                            onClick={() => {
                                if (typeof window !== "undefined" && window.innerWidth < 768) setIsOpen(false);
                            }}
                            className="flex items-center justify-center w-full text-sm font-semibold bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            Upgrade Plan
                        </Link>
                    </div>
                </div>
            </aside>
        </>
    );
}
