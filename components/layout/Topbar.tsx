"use client";

import { useSession, signOut } from "next-auth/react";
import { Bell, ChevronDown, LogOut, Settings, User, Menu } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { getInitials } from "@/lib/utils";
import { useSidebarStore } from "@/lib/store";

export function Topbar() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { toggle } = useSidebarStore();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const userName = session?.user?.name || "User";
    const userEmail = session?.user?.email || "";
    const userImage = session?.user?.image;

    return (
        <header className="h-16 min-h-[4rem] bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
            <div className="flex items-center gap-2">
                {/* Mobile Menu Toggle */}
                <button
                    onClick={toggle}
                    className="md:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    aria-label="Toggle Menu"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <h1 className="text-sm font-medium text-gray-500 hidden sm:block ml-2">
                    {/* Page title injected by child pages */}
                </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                {/* Notifications */}
                <button className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors">
                    <Bell className="w-4 h-4 text-gray-500" />
                </button>

                {/* User Menu */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        {/* Avatar */}
                        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {userImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={userImage} alt={userName} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xs font-semibold text-white">
                                    {getInitials(userName)}
                                </span>
                            )}
                        </div>
                        <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                            {userName}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Dropdown */}
                    {isOpen && (
                        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-gray-100 shadow-lg shadow-gray-100 overflow-hidden z-50">
                            <div className="px-3 py-2.5 border-b border-gray-50">
                                <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
                                <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                            </div>
                            <div className="p-1">
                                <Link
                                    href="/dashboard/settings"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <User className="w-4 h-4 text-gray-400" />
                                    Profile
                                </Link>
                                <Link
                                    href="/dashboard/settings"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Settings className="w-4 h-4 text-gray-400" />
                                    Settings
                                </Link>
                                <div className="border-t border-gray-50 my-1" />
                                <button
                                    onClick={() => signOut({ callbackUrl: "/login" })}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign out
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
