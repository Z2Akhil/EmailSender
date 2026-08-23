"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, FileText, Loader2, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";
import { Template, ApiResponse } from "@/types";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Email and WhatsApp templates are never listed together — they are built
 * differently (TipTap editor vs Meta-approved template), used by different
 * campaign channels, and are not interchangeable. The channel is a hard split,
 * not a filter you can turn off.
 */
const CHANNELS = [
    { label: "Email", value: "EMAIL" as const },
    { label: "WhatsApp", value: "WHATSAPP" as const },
];

type Channel = (typeof CHANNELS)[number]["value"];

export default function TemplatesPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [channel, setChannel] = useState<Channel>("EMAIL");
    const [mineOnly, setMineOnly] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const { data: templatesData, isLoading } = useQuery<ApiResponse<Template[]>>({
        queryKey: ["templates"],
        queryFn: async () => {
            const res = await fetch("/api/templates");
            if (!res.ok) throw new Error("Failed to fetch templates");
            return res.json();
        },
    });

    const templates = templatesData?.data || [];

    // Legacy rows have no `type` — treat them as EMAIL, same as the model default.
    const channelTemplates = templates.filter((t: Template) =>
        channel === "WHATSAPP" ? t.type === "WHATSAPP" : t.type !== "WHATSAPP"
    );

    const filteredTemplates = channelTemplates.filter((t: Template) => {
        const matchesSearch = (t.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
            (t.description?.toLowerCase() || "").includes(search.toLowerCase());
        return matchesSearch && (!mineOnly || !t.isGlobal);
    });

    const syncWhatsappMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/whatsapp/templates", { method: "POST" });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to sync templates");
            return json;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["templates"] });
            toast.success(
                data.synced > 0
                    ? `Synced ${data.synced} approved WhatsApp template${data.synced === 1 ? "" : "s"} from Meta`
                    : "No approved WhatsApp templates found in your Meta account"
            );
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to sync WhatsApp templates");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (template: Template) => {
            const res = await fetch(`/api/templates/${template.id}`, { method: "DELETE" });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to delete template");
            return json;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates"] });
            toast.success("Template deleted");
        },
        onError: (err: any) => toast.error(err.message || "Failed to delete template"),
    });

    const handleDelete = (template: Template) => {
        if (confirm(`Delete template "${template.name}"? This cannot be undone.`)) {
            deleteMutation.mutate(template);
        }
    };

    const handleSelect = (template: Template) => {
        router.push(`/dashboard/campaigns/new?templateId=${template.id}`);
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
                    <p className="text-gray-500 mt-1">
                        {channel === "EMAIL"
                            ? "Reusable email layouts for your email campaigns"
                            : "Meta-approved message templates for your WhatsApp campaigns"}
                    </p>
                </div>
                {/* Actions belong to the channel on screen — syncing Meta has no
                    meaning on the email tab, and vice versa. */}
                <div className="flex items-center gap-3">
                    {channel === "WHATSAPP" ? (
                        <>
                            <button
                                onClick={() => syncWhatsappMutation.mutate()}
                                disabled={syncWhatsappMutation.isPending}
                                className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-green-100 transition-colors border border-green-200"
                            >
                                {syncWhatsappMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Sync from Meta
                            </button>
                            <button
                                onClick={() => router.push("/dashboard/templates/new?mode=whatsapp")}
                                className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                New WhatsApp Template
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => router.push("/dashboard/templates/new?mode=simple")}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            New Email Template
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
                    {CHANNELS.map((c) => (
                        <button
                            key={c.value}
                            onClick={() => setChannel(c.value)}
                            className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${channel === c.value
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {c.label}
                            <span className="ml-1.5 text-xs text-gray-400">
                                {templates.filter((t) => c.value === "WHATSAPP" ? t.type === "WHATSAPP" : t.type !== "WHATSAPP").length}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap cursor-pointer">
                        <input
                            type="checkbox"
                            checked={mineOnly}
                            onChange={(e) => setMineOnly(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600/20"
                        />
                        Mine only
                    </label>

                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={channel === "EMAIL" ? "Search email templates..." : "Search WhatsApp templates..."}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all shadow-sm"
                        />
                    </div>

                    <div className="hidden sm:flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                            <div className="aspect-[4/5] bg-gray-50" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-gray-100 rounded-full w-2/3" />
                                <div className="h-3 bg-gray-50 rounded-full w-full" />
                                <div className="h-3 bg-gray-50 rounded-full w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredTemplates.length > 0 ? (
                <div className={viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                    : "flex flex-col gap-4"
                }>
                    {filteredTemplates.map((template) => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                            layout={viewMode}
                            onSelect={handleSelect}
                            onDelete={handleDelete}
                            onPreview={() => window.open(`/api/templates/${template.id}/preview`, '_blank')}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${channel === "EMAIL" ? "bg-blue-50" : "bg-green-50"}`}>
                        <FileText className={`w-6 h-6 ${channel === "EMAIL" ? "text-blue-600" : "text-green-600"}`} />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        No {channel === "EMAIL" ? "email" : "WhatsApp"} templates found
                    </h2>
                    {channelTemplates.length === 0 && channel === "WHATSAPP" ? (
                        <p className="text-gray-500 text-sm max-w-sm mb-6">
                            WhatsApp templates must be approved by Meta. Build one here, or sync the ones already
                            approved in your Meta Business account.
                        </p>
                    ) : (
                        <p className="text-gray-500 text-sm max-w-sm mb-6">
                            Try adjusting your search or filters to find what you&apos;re looking for.
                        </p>
                    )}
                    {/* Never resets the channel — that would mix the two lists again. */}
                    {(search || mineOnly) && (
                        <button
                            onClick={() => { setSearch(""); setMineOnly(false); }}
                            className="text-blue-600 text-sm font-semibold hover:underline"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            )}

        </div>
    );
}
