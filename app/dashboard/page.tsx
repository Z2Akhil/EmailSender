import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
    Users,
    Mail,
    BarChart3,
    TrendingUp,
    ArrowUpRight,
    Plus,
} from "lucide-react";
import Link from "next/link";

const stats = [
    {
        label: "Total Contacts",
        value: "0",
        change: "+0 this month",
        icon: Users,
        color: "text-blue-600",
        bg: "bg-blue-50",
    },
    {
        label: "Campaigns Sent",
        value: "0",
        change: "+0 this month",
        icon: Mail,
        color: "text-purple-600",
        bg: "bg-purple-50",
    },
    {
        label: "Emails Sent",
        value: "0",
        change: "+0 this month",
        icon: TrendingUp,
        color: "text-green-600",
        bg: "bg-green-50",
    },
    {
        label: "Avg Open Rate",
        value: "—",
        change: "No data yet",
        icon: BarChart3,
        color: "text-orange-600",
        bg: "bg-orange-50",
    },
];

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    const firstName = session?.user?.name?.split(" ")[0] || "there";

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Good evening, {firstName} 👋
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Here&apos;s what&apos;s happening with your campaigns.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-gray-200 transition-colors"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center`}>
                                <stat.icon className={`w-4.5 h-4.5 ${stat.color}`} />
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-gray-300" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                        <div className="text-sm text-gray-500">{stat.label}</div>
                        <div className="text-xs text-gray-400 mt-1">{stat.change}</div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Getting Started */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">
                        Get started
                    </h2>
                    <div className="space-y-3">
                        {[
                            {
                                step: "1",
                                title: "Upload your contacts",
                                desc: "Import a CSV or Excel file with your email list",
                                href: "/dashboard/contacts",
                                done: false,
                            },
                            {
                                step: "2",
                                title: "Create a campaign",
                                desc: "Pick a template and write your email",
                                href: "/dashboard/campaigns/new",
                                done: false,
                            },
                            {
                                step: "3",
                                title: "Send or schedule",
                                desc: "Send immediately or schedule for later",
                                href: "/dashboard/campaigns",
                                done: false,
                            },
                        ].map((item) => (
                            <Link
                                key={item.step}
                                href={item.href}
                                className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                            >
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {item.step}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {item.title}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors mt-0.5" />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Campaigns */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-semibold text-gray-900">
                            Recent campaigns
                        </h2>
                        <Link
                            href="/dashboard/campaigns"
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                            View all
                        </Link>
                    </div>
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                            <Mail className="w-5 h-5 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">No campaigns yet</p>
                        <p className="text-xs text-gray-400 mt-1">
                            Create your first campaign to get started
                        </p>
                        <Link
                            href="/dashboard/campaigns/new"
                            className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Create campaign
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
