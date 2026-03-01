"use client";

import { Bell, LogOut, Search, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function AdminTopbar() {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            const res = await fetch("/api/admin/logout", { method: "POST" });
            if (res.ok) {
                router.push("/admin/login");
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to log out");
        }
    };

    return (
        <header className="h-20 min-h-[5rem] bg-white/70 backdrop-blur-xl border-b border-gray-100/50 flex items-center justify-between px-8 flex-shrink-0 sticky top-0 z-40">
            <div className="flex items-center gap-6 flex-1">
                <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 w-full max-w-md focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all">
                    <Search className="w-4 h-4 text-gray-400" />

                    <input
                        type="text"
                        placeholder="Search infrastructure, users, or campaigns..."
                        className="bg-transparent border-none outline-none text-sm w-full text-gray-600 placeholder:text-gray-400"
                    />
                </div>
            </div>

            <div className="flex items-center gap-5">
                <button className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-100 hover:bg-gray-50 transition-all shadow-sm group">
                    <Bell className="w-4 h-4 text-gray-500 group-hover:scale-110 transition-transform" />
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>

                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                <div className="flex items-center gap-3 pr-2">
                    <div className="w-9 h-9 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-500/20">
                        AD
                    </div>
                    <div className="hidden lg:flex flex-col">
                        <span className="text-sm font-bold text-gray-900 leading-none">Admin User</span>
                        <span className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">Root Access</span>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Sign Out"
                >
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}
