"use client";

import { useEffect, useState } from "react";
import { Search, MoreVertical, Edit2, ShieldOff, Trash2, CheckCircle2, RefreshCw, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface UserData {
    _id: string;
    name: string;
    email: string;
    createdAt: string;
    subscription?: {
        plan: string;
    };
    isActive?: boolean;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [planFilter, setPlanFilter] = useState("all");

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                search,
                plan: planFilter,
                page: "1",
                limit: "50"
            });
            const res = await fetch(`/api/admin/users?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users);
            }
        } catch (error) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchUsers();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [search, planFilter]);

    const handleAction = async (userId: string, action: string, plan?: string) => {
        if (action === "delete" && !confirm("Are you sure you want to delete this user completely?")) return;

        try {
            if (action === "delete") {
                await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
                setUsers(users.filter(u => u._id !== userId));
                toast.success("User deleted");
            } else {
                const res = await fetch(`/api/admin/users/${userId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action, plan })
                });

                if (res.ok) {
                    toast.success("User updated");
                    fetchUsers();
                }
            }
        } catch (error) {
            toast.error("Action failed");
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tight text-[#0F172A]">Audience Control</h2>
                    <p className="text-gray-500 font-medium">Segment, audit, and manage high-scale delivery lists.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
                    <button
                        onClick={() => setPlanFilter("all")}
                        className={cn("px-4 py-2 text-xs font-bold rounded-xl transition-all", planFilter === "all" ? "bg-gray-900 text-white shadow-lg shadow-gray-900/10" : "text-gray-500 hover:bg-gray-50")}
                    >All</button>
                    <button
                        onClick={() => setPlanFilter("pro")}
                        className={cn("px-4 py-2 text-xs font-bold rounded-xl transition-all", planFilter === "pro" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10" : "text-gray-500 hover:bg-gray-50")}
                    >Pro</button>
                    <button
                        onClick={() => setPlanFilter("basic")}
                        className={cn("px-4 py-2 text-xs font-bold rounded-xl transition-all", planFilter === "basic" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10" : "text-gray-500 hover:bg-gray-50")}
                    >Basic</button>
                </div>
            </div>

            {/* Search and Advanced Filters */}
            <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20 flex flex-col md:flex-row gap-5 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Filter by identity (name, email or ID)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50/50 border border-transparent rounded-[1.25rem] text-sm focus:bg-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none text-gray-900 placeholder:text-gray-400 font-medium"
                    />
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 px-4 uppercase tracking-widest whitespace-nowrap">
                    Active Results: <span className="text-blue-600">{users.length}</span>
                </div>
            </div>

            {/* Premium Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/40 overflow-hidden relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                            <span className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">Indexing...</span>
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-6 first:rounded-tl-[2.5rem] font-black text-[10px] text-gray-400 uppercase tracking-[0.15em]">Subscriber</th>
                                <th className="px-8 py-6 font-black text-[10px] text-gray-400 uppercase tracking-[0.15em]">Access Tier</th>
                                <th className="px-8 py-6 font-black text-[10px] text-gray-400 uppercase tracking-[0.15em]">Joining Date</th>
                                <th className="px-8 py-6 font-black text-[10px] text-gray-400 uppercase tracking-[0.15em]">Status</th>
                                <th className="px-8 py-6 last:rounded-tr-[2.5rem] font-black text-[10px] text-gray-400 uppercase tracking-[0.15em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50/50">
                            {users.length === 0 && !loading ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                                                <Users className="w-8 h-8" />
                                            </div>
                                            <p className="text-gray-400 font-medium tracking-tight">Zero accounts matched your search criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user._id} className="group hover:bg-gray-50/80 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-gray-100 to-gray-200 flex items-center justify-center font-bold text-gray-500 group-hover:from-blue-500 group-hover:to-indigo-600 group-hover:text-white transition-all">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{user.name}</div>
                                                    <div className="text-xs text-gray-400 font-medium">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={cn(
                                                "inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all",
                                                user.subscription?.plan?.toLowerCase() === "pro"
                                                    ? "bg-indigo-50 text-indigo-600 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white"
                                                    : user.subscription?.plan?.toLowerCase() === "basic"
                                                        ? "bg-blue-50 text-blue-600 border-blue-100 group-hover:bg-blue-600 group-hover:text-white"
                                                        : "bg-gray-50 text-gray-500 border-gray-100 group-hover:bg-gray-600 group-hover:text-white"
                                            )}>
                                                {user.subscription?.plan || "FREE"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-gray-500 font-medium text-xs">
                                            {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </td>
                                        <td className="px-8 py-6">
                                            {user.isActive !== false ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Active</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Suspended</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-transform">
                                                {user.isActive !== false ? (
                                                    <button onClick={() => handleAction(user._id, "suspend")} className="p-2.5 text-orange-500 hover:bg-orange-50 rounded-xl transition-all" title="Restrict Identity">
                                                        <ShieldOff className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleAction(user._id, "activate")} className="p-2.5 text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all" title="Verify Identity">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button onClick={() => handleAction(user._id, "delete")} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Wipe Data">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
