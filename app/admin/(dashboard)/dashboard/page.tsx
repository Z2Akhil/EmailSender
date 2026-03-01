"use client";

import { useEffect, useState } from "react";
import { Users, Mail, CreditCard, Activity, ArrowUpRight, RefreshCw, Send, CheckCircle2, ShieldAlert } from "lucide-react";

interface AdminStats {
    users: {
        total: number;
        active: number;
        distribution: { free: number; basic: number; pro: number };
    };
    campaigns: {
        total: number;
        emailsSent: number;
        emailsFailed: number;
    };
    revenue: {
        estimatedMRR: number;
        currency: string;
    };
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/stats");
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to load admin stats", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <Activity className="w-12 h-12 text-blue-500 animate-spin" />
                    <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-20 animate-pulse" />
                </div>
                <p className="text-gray-400 text-sm font-medium animate-pulse">Syncing platform metrics...</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-12 text-center bg-white rounded-3xl border border-red-100 shadow-xl shadow-red-500/5">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-500">
                    <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Connection Failed</h3>
                <p className="text-gray-500 max-w-xs mx-auto mt-2">We couldn't reach the infrastructure metrics. Check your database connection.</p>
                <button onClick={fetchStats} className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all">Retry Sync</button>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 text-[10px] font-bold uppercase tracking-wider rounded-lg border border-blue-200/50">Admin Suite v1.2</span>
                    </div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-[#0F172A]">Platform Analytics</h2>
                    <p className="text-gray-500 text-base font-medium">Real-time performance across the delivery network.</p>
                </div>
                <button
                    onClick={fetchStats}
                    className="flex items-center gap-2.5 px-5 py-3 bg-[#0F172A] text-white text-sm font-bold rounded-2xl hover:bg-black transition-all shadow-xl shadow-blue-900/10 active:scale-95 group"
                >
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    Refresh Node
                </button>
            </div>

            {/* Premium Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Total Users Card */}
                <div className="group bg-white rounded-[2rem] p-8 border border-gray-100/80 shadow-2xl shadow-gray-200/50 relative overflow-hidden transition-all hover:border-blue-200 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                        <Users className="w-32 h-32 text-blue-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 ring-8 ring-blue-50/50 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                            <Users className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Total Audience</p>
                        <h3 className="text-4xl font-black text-gray-900 mt-2 tracking-tight">
                            {stats.users.total.toLocaleString()}
                        </h3>
                        <div className="mt-4 flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100" />
                                ))}
                            </div>
                            <span className="text-xs font-bold text-gray-500">{stats.users.active} <span className="text-emerald-500">Live active</span></span>
                        </div>
                    </div>
                </div>

                {/* Campaigns Card */}
                <div className="group bg-white rounded-[2rem] p-8 border border-gray-100/80 shadow-2xl shadow-gray-200/50 relative overflow-hidden transition-all hover:border-purple-200 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                        <Send className="w-32 h-32 text-purple-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 ring-8 ring-purple-50/50 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                            <Mail className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Outgoing Flux</p>
                        <h3 className="text-4xl font-black text-gray-900 mt-2 tracking-tight">
                            {stats.campaigns.emailsSent.toLocaleString()}
                        </h3>
                        <div className="mt-4 flex items-center gap-2 text-xs font-bold text-gray-500">
                            <span className="px-2 py-0.5 bg-gray-100 rounded-md">Aggregated</span>
                            <span>{stats.campaigns.total} Campaigns</span>
                        </div>
                    </div>
                </div>

                {/* Revenue Card */}
                <div className="group bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-[2rem] p-8 border border-white/5 shadow-2xl shadow-blue-900/20 relative overflow-hidden transition-all hover:scale-[1.02]">
                    <div className="absolute top-0 right-0 p-6 opacity-[0.1]">
                        <CreditCard className="w-32 h-32 text-white" />
                    </div>
                    <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">Revenue Flow</p>
                        <h3 className="text-4xl font-black text-white mt-2 tracking-tight">
                            ${stats.revenue.estimatedMRR.toLocaleString()}
                        </h3>
                        <div className="mt-4 flex items-center gap-1.5">
                            <div className="h-1.5 w-12 bg-emerald-500/30 rounded-full overflow-hidden">
                                <div className="h-full w-2/3 bg-emerald-400" />
                            </div>
                            <span className="text-xs font-bold text-emerald-400">+12.4% Monthly Growth</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Distribution and Health Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Distribution Chart (3 Cols) */}
                <div className="lg:col-span-3 bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/30">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 leading-none">Subscription Mix</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-2">Active tier breakdown</p>
                        </div>
                        <div className="flex gap-1.5">
                            {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-200" />)}
                        </div>
                    </div>

                    <div className="space-y-8">
                        {[
                            { label: "Free Tier", count: stats.users.distribution.free, color: "bg-gray-400", hex: "#94a3b8" },
                            { label: "Basic Plan", count: stats.users.distribution.basic, color: "bg-blue-500", hex: "#3b82f6" },
                            { label: "Pro Plan", count: stats.users.distribution.pro, color: "bg-indigo-600", hex: "#4f46e5" }
                        ].map((tier, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex items-end justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${tier.color}`} />
                                        <span className="text-sm font-bold text-gray-700">{tier.label}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-black text-gray-900">{tier.count}</span>
                                        <span className="text-[10px] text-gray-400 font-bold ml-1 uppercase">users</span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-50 border border-gray-100 rounded-2xl h-3 p-0.5">
                                    <div
                                        className={`${tier.color} h-full rounded-2xl transition-all duration-1000 ease-out shadow-[0_0_15px_-3px_rgba(0,0,0,0.1)]`}
                                        style={{ width: `${(tier.count / Math.max(1, stats.users.total)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Health & Status (2 Cols) */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-[#0F172A] rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-900/50">
                        <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-1/4 -translate-y-1/4">
                            <Activity className="w-48 h-48" />
                        </div>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                            Node Performance
                        </h3>
                        <div className="space-y-6 relative z-10">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-300">Deliverability</span>
                                </div>
                                <span className="text-lg font-black text-emerald-400">98.2%</span>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                                        <ArrowUpRight className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-300">API Latency</span>
                                </div>
                                <span className="text-lg font-black text-blue-400">42ms</span>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-lg">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-500/20 text-red-400 rounded-xl">
                                        <RefreshCw className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-300">Bounce Rate</span>
                                </div>
                                <span className="text-lg font-black text-red-400">0.8%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
