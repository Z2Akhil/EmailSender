"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Users,
    Mail,
    BarChart3,
    TrendingUp,
    ArrowUpRight,
    Plus,
    Loader2,
    Clock,
    CheckCircle2,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Campaign, ApiResponse } from "@/types";
import { ProfileSetupDialog } from "@/components/dashboard/ProfileSetupDialog";

interface DashboardStats {
    totalContacts: number;
    totalCampaigns: number;
    totalEmailsSent: number;
    avgOpenRate: number;
    avgClickRate: number;
    recentCampaigns: Campaign[];
}

export default function DashboardPage() {
    const { data: session } = useSession();
    const { data: statsResponse, isLoading } = useQuery<ApiResponse<DashboardStats>>({
        queryKey: ["dashboard-stats"],
        queryFn: async () => {
            const res = await fetch("/api/dashboard/stats");
            if (!res.ok) throw new Error("Failed to fetch dashboard stats");
            return res.json();
        },
    });

    const statsData = statsResponse?.data;

    const statCards = [
        {
            label: "Total Contacts",
            value: statsData?.totalContacts.toLocaleString() || "0",
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
            trend: "All time growth"
        },
        {
            label: "Campaigns Sent",
            value: statsData?.totalCampaigns.toLocaleString() || "0",
            icon: Mail,
            color: "text-purple-600",
            bg: "bg-purple-50",
            trend: "Completed dispatches"
        },
        {
            label: "Emails Sent",
            value: statsData?.totalEmailsSent.toLocaleString() || "0",
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50",
            trend: "Total deliveries"
        },
        {
            label: "Avg Open Rate",
            value: statsData ? `${statsData.avgOpenRate.toFixed(1)}%` : "—",
            icon: BarChart3,
            color: "text-orange-600",
            bg: "bg-orange-50",
            trend: "Engagement metrics"
        },
    ];

    const STATUS_ICON = {
        DRAFT: { icon: Clock, color: "text-gray-400" },
        SCHEDULED: { icon: Clock, color: "text-blue-500" },
        SENDING: { icon: Loader2, color: "text-purple-500 animate-spin" },
        SENT: { icon: CheckCircle2, color: "text-green-500" },
        CANCELLED: { icon: AlertCircle, color: "text-red-500" },
    };

    return (
        <div className="max-w-6xl mx-auto">
            {session?.user && session.user.isProfileComplete === false && (
                <ProfileSetupDialog
                    defaultName={session.user.name || ""}
                    defaultEmail={session.user.email || ""}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Dashboard Overview
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Here&apos;s what&apos;s happening with your workspace.
                    </p>
                </div>
                <Link
                    href="/dashboard/campaigns/new"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    New Campaign
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {statCards.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center transition-transform group-hover:scale-110`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-gray-200 group-hover:text-blue-400 transition-colors" />
                        </div>
                        {isLoading ? (
                            <div className="space-y-2">
                                <div className="h-7 w-20 bg-gray-50 rounded-full animate-pulse" />
                                <div className="h-4 w-28 bg-gray-50 rounded-full animate-pulse" />
                            </div>
                        ) : (
                            <>
                                <div className="text-2xl font-bold text-gray-900 mb-0.5">{stat.value}</div>
                                <div className="text-sm font-medium text-gray-400 uppercase tracking-wider">{stat.label}</div>
                                <div className="text-[10px] font-bold text-gray-300 mt-2 uppercase tracking-tight">{stat.trend}</div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Main Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                Recent Campaigns
                                {statsData?.recentCampaigns.length === 0 && (
                                    <span className="text-xs font-normal text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">Empty</span>
                                )}
                            </h2>
                            <Link
                                href="/dashboard/campaigns"
                                className="text-xs text-blue-600 hover:underline font-semibold"
                            >
                                View all campaigns
                            </Link>
                        </div>

                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 w-full bg-gray-50 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : statsData?.recentCampaigns.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
                                    <Mail className="w-5 h-5 text-gray-300" />
                                </div>
                                <p className="text-sm font-semibold text-gray-900">No campaigns yet</p>
                                <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto">
                                    Launch your first email campaign to see activity here.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {statsData?.recentCampaigns.map((campaign) => {
                                    const Status = STATUS_ICON[campaign.status as keyof typeof STATUS_ICON] || STATUS_ICON.DRAFT;
                                    return (
                                        <Link
                                            key={campaign.id}
                                            href={`/dashboard/campaigns/${campaign.id}${campaign.status === 'SENT' ? '/analytics' : '/edit'}`}
                                            className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-100"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                                                    <Status.icon className={`w-5 h-5 ${Status.color}`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-bold text-gray-900 truncate pr-4">{campaign.name}</h3>
                                                    <div className="flex items-center gap-3 mt-0.5">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{campaign.status}</span>
                                                        <span className="text-[10px] font-bold text-gray-300 uppercase whitespace-nowrap">
                                                            {new Date(campaign.updatedAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8 pl-4">
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-xs font-bold text-gray-900">{((campaign.openCount / (campaign.sentCount || 1)) * 100).toFixed(1)}%</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Opens</p>
                                                </div>
                                                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar / Quick View */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
                        <h2 className="text-lg font-bold mb-2">Grow your list</h2>
                        <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                            You currently have {statsData?.totalContacts || 0} contacts. Upload more to reach a wider audience.
                        </p>
                        <Link
                            href="/dashboard/contacts"
                            className="inline-flex items-center justify-center w-full bg-white text-blue-600 font-bold py-3 px-4 rounded-xl text-sm hover:bg-blue-50 transition-colors"
                        >
                            Upload Contacts
                        </Link>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                        <h2 className="text-base font-bold text-gray-900 mb-4">Quick Links</h2>
                        <div className="space-y-2">
                            {[
                                { label: "Campaign Templates", href: "/dashboard/templates" },
                                { label: "Account Settings", href: "/dashboard/settings" },
                                { label: "Verified Domains", href: "/dashboard/settings/domains" }
                            ].map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.href}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600 hover:text-blue-600 transition-all border border-transparent hover:border-gray-50"
                                >
                                    {link.label}
                                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
