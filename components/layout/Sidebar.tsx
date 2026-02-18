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
} from "lucide-react";
import { cn } from "@/lib/utils";

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

    return (
        <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-100 flex flex-col h-full">
            {/* Logo */}
            <div className="p-5 border-b border-gray-100">
                <Link href="/dashboard" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-gray-900">BulkMailer</span>
                </Link>
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
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                                isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <item.icon
                                className={cn(
                                    "w-4 h-4",
                                    isActive ? "text-blue-600" : "text-gray-400"
                                )}
                            />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Upgrade CTA */}
            <div className="p-3">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-xs font-semibold text-gray-900 mb-1">Free Plan</p>
                    <p className="text-xs text-gray-500 mb-3">
                        1,000 emails/mo · 500 contacts
                    </p>
                    <Link
                        href="/dashboard/settings?tab=billing"
                        className="block text-center text-xs font-semibold bg-blue-600 text-white py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Upgrade Plan
                    </Link>
                </div>
            </div>
        </aside>
    );
}
