"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Mail,
    CreditCard,
    Activity,
    ShieldAlert,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const adminNavItems = [
    {
        label: "Overview",
        href: "/admin/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "User Management",
        href: "/admin/users",
        icon: Users,
    },
    {
        label: "All Campaigns",
        href: "/admin/campaigns",
        icon: Mail,
    },
    {
        label: "Revenue",
        href: "/admin/revenue",
        icon: CreditCard,
    },
    {
        label: "Monitor & Logs",
        href: "/admin/monitor",
        icon: Activity,
    },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-72 bg-[#0F172A] flex flex-col h-full flex-shrink-0 hidden md:flex border-r border-white/5 relative overflow-hidden">
            {/* Background Decorative Gradient */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-indigo-600 rounded-full blur-[80px]" />
            </div>

            {/* Logo and Header */}
            <div className="p-6 flex items-center h-20 relative z-10">
                <Link href="/admin/dashboard" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                        <Zap className="w-5 h-5 text-white fill-white/20" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-bold text-white tracking-tight leading-none">BulkMailer</span>
                        <span className="text-[10px] uppercase font-bold text-blue-400 tracking-[0.1em] mt-1 opacity-80">Admin Console</span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto relative z-10 scrollbar-none">
                <div className="px-3 mb-4 mt-2">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Main Menu</p>
                </div>
                {adminNavItems.map((item) => {
                    const isActive =
                        item.href === "/admin/dashboard"
                            ? pathname === "/admin/dashboard"
                            : pathname.startsWith(item.href);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative overflow-hidden",
                                isActive
                                    ? "bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
                                    : "text-gray-400 hover:text-white"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />
                            )}
                            <item.icon
                                className={cn(
                                    "w-5 h-5 flex-shrink-0 transition-colors",
                                    isActive ? "text-blue-400" : "text-gray-500 group-hover:text-blue-400"
                                )}
                            />
                            <span className="relative z-10">{item.label}</span>
                            {!isActive && (
                                <div className="absolute inset-0 bg-white/0 hover:bg-white/[0.03] transition-colors" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Status Footer */}
            <div className="p-6 relative z-10">
                <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-md rounded-2xl p-4 border border-white/5 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <Activity className="w-4 h-4 text-green-400" />
                        </div>
                        <span className="text-xs font-bold text-gray-300">Live Services</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Infrastructure</p>
                            <div className="flex items-center gap-1.5">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-[10px] font-bold text-green-400">99.9%</span>
                            </div>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-1">
                            <div className="bg-green-500/50 w-[99%] h-full rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
