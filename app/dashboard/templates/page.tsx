"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, FileText, Loader2, LayoutGrid, List, X } from "lucide-react";
import { Template, ApiResponse } from "@/types";
import { TemplateCard } from "@/components/templates/TemplateCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const CATEGORIES = [
    { label: "All Templates", value: "all" },
    { label: "Official", value: "official" },
    { label: "My Templates", value: "custom" },
];

export default function TemplatesPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTemplate, setNewTemplate] = useState({ name: "", description: "", htmlContent: "" });

    const { data: templatesData, isLoading } = useQuery<ApiResponse<Template[]>>({
        queryKey: ["templates"],
        queryFn: async () => {
            const res = await fetch("/api/templates");
            if (!res.ok) throw new Error("Failed to fetch templates");
            return res.json();
        },
    });

    const createTemplateMutation = useMutation({
        mutationFn: async (data: typeof newTemplate) => {
            const res = await fetch("/api/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Failed to create template");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates"] });
            setIsCreateModalOpen(false);
            setNewTemplate({ name: "", description: "", htmlContent: "" });
        },
    });

    const templates = templatesData?.data || [];

    const filteredTemplates = templates.filter((t: Template) => {
        const matchesSearch = (t.name?.toLowerCase() || "").includes(search.toLowerCase()) ||
            (t.description?.toLowerCase() || "").includes(search.toLowerCase());
        const matchesCategory = category === "all" ||
            (category === "official" && t.isGlobal) ||
            (category === "custom" && !t.isGlobal);
        return matchesSearch && matchesCategory;
    });

    const handleSelect = (template: Template) => {
        router.push(`/dashboard/campaigns/new?templateId=${template.id}`);
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
                    <p className="text-gray-500 mt-1">Select a starting point for your next campaign</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Create Custom
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
                    {CATEGORIES.map((c) => (
                        <button
                            key={c.value}
                            onClick={() => setCategory(c.value)}
                            className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${category === c.value
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {c.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search templates..."
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
                            onPreview={() => window.open(`/api/templates/${template.id}/preview`, '_blank')}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                        <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h2>
                    <p className="text-gray-500 text-sm max-w-sm mb-6">
                        Try adjusting your search or filters to find what you&apos;re looking for.
                    </p>
                    <button
                        onClick={() => { setSearch(""); setCategory("all"); }}
                        className="text-blue-600 text-sm font-semibold hover:underline"
                    >
                        Clear all filters
                    </button>
                </div>
            )}

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Create Custom Template</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Template Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                                    placeholder="e.g. Sales Follow-up"
                                    value={newTemplate.name}
                                    onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Description</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                                    placeholder="What is this template for?"
                                    value={newTemplate.description}
                                    onChange={e => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">HTML Content</label>
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all min-h-[300px] font-mono"
                                    placeholder="<h1>Hello {{name}}!</h1>"
                                    value={newTemplate.htmlContent}
                                    onChange={e => setNewTemplate({ ...newTemplate, htmlContent: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
                            <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</button>
                            <button
                                onClick={() => createTemplateMutation.mutate(newTemplate)}
                                disabled={createTemplateMutation.isPending || !newTemplate.name || !newTemplate.htmlContent}
                                className="bg-blue-600 text-white text-sm font-semibold px-6 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200"
                            >
                                {createTemplateMutation.isPending ? "Creating..." : "Save Template"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
