"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Mail, Loader2, Filter } from "lucide-react";
import Link from "next/link";
import { Campaign, ApiResponse } from "@/types";
import { CampaignCard } from "@/components/campaigns/CampaignCard";

const FILTERS = [
    { label: "All Campaigns", value: "" },
    { label: "Drafts", value: "DRAFT" },
    { label: "Scheduled", value: "SCHEDULED" },
    { label: "Sent", value: "SENT" },
];

export default function CampaignsPage() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    const { data: campaignsData, isLoading } = useQuery<ApiResponse<Campaign[]>>({
        queryKey: ["campaigns"],
        queryFn: async () => {
            const res = await fetch("/api/campaigns");
            if (!res.ok) throw new Error("Failed to fetch campaigns");
            return res.json();
        },
        refetchInterval: (query) => {
            const data = query.state.data?.data;
            return data?.some((c: Campaign) => c.status === "SENDING") ? 3000 : false;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            if (!confirm("Are you sure you want to delete this campaign?")) return;
            const res = await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete campaign");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["campaigns"] });
        },
    });

    const duplicateMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/campaigns/${id}`);
            if (!res.ok) throw new Error("Source campaign not found");
            const { data: source } = await res.json();

            const createRes = await fetch("/api/campaigns", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: `${source.name} (Copy)`,
                    subject: source.subject,
                    fromName: source.fromName,
                    fromEmail: source.fromEmail,
                    replyTo: source.replyTo,
                    templateId: source.templateId,
                    htmlContent: source.htmlContent,
                    recipientListId: source.recipientListId,
                    provider: source.provider,
                    domainId: source.domainId,
                }),
            });
            if (!createRes.ok) throw new Error("Failed to duplicate campaign");
            return createRes.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["campaigns"] });
        },
    });

    const campaigns = campaignsData?.data || [];

    const filteredCampaigns = campaigns.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.subject.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || c.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
                    <p className="text-gray-500 mt-1">Create and manage your email campaigns</p>
                </div>
                <Link
                    href="/dashboard/campaigns/new"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    New Campaign
                </Link>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {FILTERS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setStatusFilter(f.value)}
                            className={`whitespace-nowrap px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${statusFilter === f.value
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search campaigns..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all shadow-sm"
                    />
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                            <div className="flex justify-between mb-4">
                                <div className="w-10 h-10 bg-gray-100 rounded-xl" />
                                <div className="w-20 h-6 bg-gray-50 rounded-full" />
                            </div>
                            <div className="space-y-3 mb-6">
                                <div className="h-5 bg-gray-100 rounded-full w-2/3" />
                                <div className="h-4 bg-gray-50 rounded-full w-full" />
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                                <div className="h-4 bg-gray-50 rounded-full w-1/2" />
                                <div className="h-4 bg-gray-50 rounded-full w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredCampaigns.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCampaigns.map((campaign) => (
                        <CampaignCard
                            key={campaign.id}
                            campaign={campaign}
                            onDelete={(id) => deleteMutation.mutate(id)}
                            onDuplicate={(id) => duplicateMutation.mutate(id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
                        <Mail className="w-6 h-6 text-purple-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">No campaigns found</h2>
                    <p className="text-gray-500 text-sm max-w-sm mb-6">
                        {search || statusFilter
                            ? "Try adjusting your search or filters to find what you're looking for."
                            : "Create your first email campaign and start reaching your audience."
                        }
                    </p>
                    <Link
                        href="/dashboard/campaigns/new"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Campaign
                    </Link>
                </div>
            )}
        </div>
    );
}
