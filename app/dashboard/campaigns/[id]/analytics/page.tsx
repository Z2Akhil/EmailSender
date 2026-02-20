"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
    BarChart3,
    ChevronLeft,
    Mail,
    MousePointer2,
    Eye,
    AlertCircle,
    UserMinus,
    Loader2,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import Link from "next/link";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from "recharts";
import { ApiResponse, Campaign } from "@/types";

interface StatsData {
    campaign: Campaign;
    statusBreakdown: Record<string, number>;
    timeline: { time: string; opens: number }[];
}

export default function CampaignAnalyticsPage() {
    const { id } = useParams();
    const router = useRouter();

    const { data: statsResponse, isLoading, error } = useQuery<ApiResponse<StatsData>>({
        queryKey: ["campaign-stats", id],
        queryFn: async () => {
            const res = await fetch(`/api/campaigns/${id}/stats`);
            if (!res.ok) throw new Error("Failed to fetch analytics");
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Crunching the numbers...</p>
            </div>
        );
    }

    if (error || !statsResponse?.data) {
        return (
            <div className="max-w-4xl mx-auto py-12 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">Failed to load analytics</h1>
                <p className="text-gray-500 mb-6">There was an error loading the statistics for this campaign.</p>
                <button
                    onClick={() => router.back()}
                    className="text-blue-600 font-semibold hover:underline"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const { campaign, statusBreakdown, timeline } = statsResponse.data;

    const openRate = campaign.sentCount > 0
        ? (campaign.openCount / campaign.sentCount) * 100
        : 0;

    const clickRate = campaign.sentCount > 0
        ? (campaign.clickCount / campaign.sentCount) * 100
        : 0;

    const stats = [
        {
            label: "Total Sent",
            value: campaign.sentCount.toLocaleString(),
            icon: Mail,
            color: "text-blue-600",
            bg: "bg-blue-50",
            sub: `${campaign.totalRecipients.toLocaleString()} total recipients`
        },
        {
            label: "Open Rate",
            value: `${openRate.toFixed(1)}%`,
            icon: Eye,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            sub: `${campaign.openCount.toLocaleString()} total opens`
        },
        {
            label: "Click Rate",
            value: `${clickRate.toFixed(1)}%`,
            icon: MousePointer2,
            color: "text-indigo-600",
            bg: "bg-indigo-50",
            sub: `${campaign.clickCount.toLocaleString()} total clicks`
        },
        {
            label: "Bounces",
            value: campaign.bounceCount.toLocaleString(),
            icon: AlertCircle,
            color: "text-amber-600",
            bg: "bg-amber-50",
            sub: "Failed deliveries"
        },
    ];

    return (
        <div className="max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/dashboard/campaigns"
                    className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors group"
                >
                    <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Campaigns
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{campaign.name}</h1>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-100">
                                Sent
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            Sent on {new Date(campaign.sentAt || campaign.updatedAt).toLocaleLongDateString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <BarChart3 className="w-4 h-4 text-gray-200" />
                        </div>
                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-1">{stat.label}</h3>
                        <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                        <p className="text-xs text-gray-400 font-medium">{stat.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
                {/* Timeline Chart */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Campaign Activity</h2>
                            <p className="text-sm text-gray-400">Opens over time (GMT)</p>
                        </div>
                    </div>

                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timeline.length > 0 ? timeline : [{ time: "No data", opens: 0 }]}>
                                <defs>
                                    <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="time"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        fontSize: '12px'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="opens"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorOpens)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Delivery Details</h2>

                    <div className="space-y-6 flex-1">
                        {[
                            { label: "Delivered", count: statusBreakdown.DELIVERED || statusBreakdown.OPENED || statusBreakdown.CLICKED || 0, color: "bg-emerald-500" },
                            { label: "Opened", count: statusBreakdown.OPENED || statusBreakdown.CLICKED || 0, color: "bg-blue-500" },
                            { label: "Clicked", count: statusBreakdown.CLICKED || 0, color: "bg-indigo-500" },
                            { label: "Unsubscribed", count: statusBreakdown.UNSUBSCRIBED || 0, color: "bg-purple-500" },
                            { label: "Bounced", count: statusBreakdown.BOUNCED || 0, color: "bg-amber-500" },
                            { label: "Failed", count: statusBreakdown.FAILED || 0, color: "bg-red-500" },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{item.count.toLocaleString()}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-50 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${item.color} transition-all duration-1000`}
                                        style={{ width: `${campaign.sentCount > 0 ? (item.count / campaign.sentCount) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-50 bg-gray-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                            <span>Campaign Completion</span>
                            <span className="font-bold text-gray-900">100%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white rounded-full overflow-hidden border border-gray-100">
                            <div className="h-full bg-blue-600 w-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper to avoid issues with date formatting in components
// You can remove this if you have a proper locale utility
const localeDateString = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
};

// Extension for Date to support the above helper logic in a cleaner way if desired
declare global {
    interface Date {
        toLocaleLongDateString(): string;
    }
}

Date.prototype.toLocaleLongDateString = function () {
    return new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(this);
};
