"use client";

import { useEffect, useState } from "react";
import { Search, Loader2, Send, Clock, XCircle, AlertCircle } from "lucide-react";

interface CampaignData {
    _id: string;
    name: string;
    status: string;
    createdAt: string;
    channel: string;
    userId: {
        name: string;
        email: string;
    };
    stats: {
        sent: number;
        failed: number;
        opened?: number;
    };
}

export default function AdminCampaignsPage() {
    const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                search,
                status: statusFilter,
                page: "1",
                limit: "50"
            });
            const res = await fetch(`/api/admin/campaigns?${query.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setCampaigns(data.campaigns);
            }
        } catch (error) {
            console.error("Failed to load campaigns", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => fetchCampaigns(), 300);
        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, statusFilter]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed": return <Send className="w-4 h-4 text-green-500" />;
            case "processing": return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
            case "draft": return <Clock className="w-4 h-4 text-gray-400" />;
            case "failed": return <XCircle className="w-4 h-4 text-red-500" />;
            default: return <AlertCircle className="w-4 h-4 text-orange-500" />;
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case "completed": return "bg-green-50 text-green-700 border-green-200";
            case "processing": return "bg-blue-50 text-blue-700 border-blue-200";
            case "draft": return "bg-gray-50 text-gray-700 border-gray-200";
            case "failed": return "bg-red-50 text-red-700 border-red-200";
            default: return "bg-orange-50 text-orange-700 border-orange-200";
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Campaign Monitoring</h2>
                <p className="text-sm text-gray-500">Monitor all broadcasts across the platform.</p>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search campaign name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-auto min-w-[150px]"
                >
                    <option value="all">All Statuses</option>
                    <option value="draft">Drafts</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-medium">Campaign</th>
                                <th className="px-6 py-4 font-medium">User / Sender</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Channel</th>
                                <th className="px-6 py-4 font-medium text-right">Metrics (Sent/Failed)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 flex justify-center items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" /> Loading campaigns...
                                    </td>
                                </tr>
                            ) : campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No campaigns found.</td>
                                </tr>
                            ) : (
                                campaigns.map((campaign) => (
                                    <tr key={campaign._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{campaign.name}</div>
                                            <div className="text-xs text-gray-500">{new Date(campaign.createdAt).toLocaleString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-900 font-medium">{campaign.userId?.name || "Unknown"}</div>
                                            <div className="text-xs text-gray-500">{campaign.userId?.email || "N/A"}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(campaign.status)}`}>
                                                {getStatusIcon(campaign.status)}
                                                {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="uppercase text-xs font-bold text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                {campaign.channel || "EMAIL"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-green-600 font-medium text-sm">{campaign.stats?.sent || 0} sent</span>
                                                {campaign.stats?.failed > 0 && (
                                                    <span className="text-red-500 font-medium text-xs mt-0.5">{campaign.stats.failed} failed</span>
                                                )}
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
