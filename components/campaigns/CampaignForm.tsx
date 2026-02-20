"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft, Check, ChevronRight, Settings, Layout,
    FileText, Users, Send, Loader2, Search, Plus
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Campaign, Template, ContactList, ApiResponse } from "@/types";
import { TemplateCard } from "@/components/templates/TemplateCard";

type Step = "SETTINGS" | "TEMPLATE" | "CONTENT" | "RECIPIENTS" | "REVIEW";

const STEPS: { id: Step; label: string; icon: any }[] = [
    { id: "SETTINGS", label: "Settings", icon: Settings },
    { id: "TEMPLATE", label: "Template", icon: Layout },
    { id: "CONTENT", label: "Content", icon: FileText },
    { id: "RECIPIENTS", label: "Recipients", icon: Users },
    { id: "REVIEW", label: "Review", icon: Send },
];

interface CampaignFormProps {
    initialData?: Partial<Campaign>;
    isEditing?: boolean;
}

export function CampaignForm({ initialData, isEditing = false }: CampaignFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const [currentStep, setCurrentStep] = useState<Step>("SETTINGS");

    // Form State
    const [formData, setFormData] = useState({
        name: initialData?.name || "",
        subject: initialData?.subject || "",
        fromName: initialData?.fromName || "",
        fromEmail: initialData?.fromEmail || "",
        replyTo: initialData?.replyTo || "",
        templateId: initialData?.templateId || "",
        htmlContent: initialData?.htmlContent || "",
        textContent: initialData?.textContent || "",
        recipientListId: initialData?.recipientListId || "",
    });

    const urlTemplateId = searchParams.get("templateId");

    const [templateSearch, setTemplateSearch] = useState("");
    const [listSearch, setListSearch] = useState("");

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || "",
                subject: initialData.subject || "",
                fromName: initialData.fromName || "",
                fromEmail: initialData.fromEmail || "",
                replyTo: initialData.replyTo || "",
                templateId: initialData.templateId || "",
                htmlContent: initialData.htmlContent || "",
                textContent: initialData.textContent || "",
                recipientListId: initialData.recipientListId || "",
            });
        }
    }, [initialData]);

    // Queries
    const { data: templatesData, isLoading: isLoadingTemplates } = useQuery<ApiResponse<Template[]>>({
        queryKey: ["templates"],
        queryFn: async () => {
            const res = await fetch("/api/templates");
            if (!res.ok) throw new Error("Failed to fetch templates");
            return res.json();
        },
        enabled: currentStep === "TEMPLATE" || !!urlTemplateId,
    });

    // Auto-select template if ID in URL
    useEffect(() => {
        if (urlTemplateId && templatesData?.data && !formData.templateId) {
            const template = templatesData.data.find(t => t.id === urlTemplateId || (t as any)._id === urlTemplateId);
            if (template) {
                setFormData(prev => ({
                    ...prev,
                    templateId: template.id || (template as any)._id,
                    htmlContent: template.htmlContent,
                }));
            }
        }
    }, [urlTemplateId, templatesData, formData.templateId]);

    const { data: listsData, isLoading: isLoadingLists } = useQuery<ApiResponse<ContactList[]>>({
        queryKey: ["contact-lists"],
        queryFn: async () => {
            const res = await fetch("/api/contacts/lists");
            if (!res.ok) throw new Error("Failed to fetch contact lists");
            return res.json();
        },
        enabled: currentStep === "RECIPIENTS",
    });

    const templates = templatesData?.data || [];
    const filteredTemplates = templates.filter(t =>
        t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
        t.description?.toLowerCase().includes(templateSearch.toLowerCase())
    );

    const lists = listsData?.data || [];
    const filteredLists = lists.filter(l =>
        l.name.toLowerCase().includes(listSearch.toLowerCase())
    );

    const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

    const handleNext = () => {
        const nextStep = STEPS[currentStepIndex + 1];
        if (nextStep) setCurrentStep(nextStep.id);
    };

    const handleBack = () => {
        const prevStep = STEPS[currentStepIndex - 1];
        if (prevStep) setCurrentStep(prevStep.id);
    };

    const selectTemplate = (template: Template) => {
        setFormData({
            ...formData,
            templateId: template.id,
            htmlContent: template.htmlContent,
            textContent: "",
        });
        handleNext();
    };

    const selectList = (list: ContactList) => {
        setFormData({
            ...formData,
            recipientListId: list.id,
        });
        handleNext();
    };

    const mutation = useMutation({
        mutationFn: async () => {
            const url = isEditing ? `/api/campaigns/${initialData?.id}` : "/api/campaigns";
            const method = isEditing ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || `Failed to ${isEditing ? "update" : "create"} campaign`);
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["campaigns"] });
            if (isEditing) queryClient.invalidateQueries({ queryKey: ["campaign", initialData?.id] });
            router.push("/dashboard/campaigns");
        },
    });

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/dashboard/campaigns")}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{isEditing ? "Edit" : "Create"} Campaign</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Let&apos;s get your campaign ready to send</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                        onClick={() => router.push("/dashboard/campaigns")}
                    >
                        Cancel
                    </button>
                    <button
                        className="bg-white border border-gray-200 text-gray-700 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending}
                    >
                        {mutation.isPending ? "Saving..." : "Save as Draft"}
                    </button>
                </div>
            </div>

            {/* Stepper */}
            <div className="mb-10">
                <div className="flex items-center justify-between relative px-2">
                    {/* Progress Bar */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
                    <div
                        className="absolute top-1/2 left-0 h-0.5 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-300"
                        style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                    />

                    {STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isCompleted = idx < currentStepIndex;
                        const isActive = idx === currentStepIndex;

                        return (
                            <div key={step.id} className="relative z-10 flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${isCompleted ? "bg-blue-600 border-blue-600 text-white" :
                                        isActive ? "bg-white border-blue-600 text-blue-600 shadow-lg shadow-blue-100" :
                                            "bg-white border-gray-200 text-gray-400"
                                        }`}
                                >
                                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                                </div>
                                <span className={`absolute -bottom-7 whitespace-nowrap text-xs font-bold transition-colors ${isActive ? "text-gray-900" : "text-gray-400"
                                    }`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step Content */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm min-h-[500px] flex flex-col overflow-hidden">
                {currentStep === "SETTINGS" && (
                    <div className="p-8 max-w-2xl mx-auto flex-1 w-full">
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-gray-900">Campaign Settings</h2>
                            <p className="text-gray-500 text-sm mt-1">Define the basics of your campaign</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Internal Campaign Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. March Newsletter 2026"
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                                <p className="text-[11px] text-gray-400">This will not be visible to your recipients.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Email Subject Line</label>
                                <input
                                    type="text"
                                    placeholder="Something catchy..."
                                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">From Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. John from BulkMailer"
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                                        value={formData.fromName}
                                        onChange={e => setFormData({ ...formData, fromName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700">From Email</label>
                                    <input
                                        type="email"
                                        placeholder="hello@example.com"
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                                        value={formData.fromEmail}
                                        onChange={e => setFormData({ ...formData, fromEmail: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === "TEMPLATE" && (
                    <div className="p-8 flex flex-col flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Select Template</h2>
                                <p className="text-gray-500 text-sm mt-1">Choose a layout to start with</p>
                            </div>

                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search templates..."
                                    value={templateSearch}
                                    onChange={(e) => setTemplateSearch(e.target.value)}
                                    className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {isLoadingTemplates ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                                        <div className="aspect-[4/5] bg-gray-50" />
                                        <div className="p-4 space-y-3">
                                            <div className="h-4 bg-gray-100 rounded-full w-2/3" />
                                            <div className="h-3 bg-gray-50 rounded-full w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredTemplates.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                <button
                                    onClick={() => handleNext()}
                                    className="group aspect-[4/5] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center p-6 text-center hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                                >
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3 text-gray-400 group-hover:text-blue-500 transition-colors">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">Start from Scratch</span>
                                    <p className="text-xs text-gray-500 mt-1">Blank canvas for your creative ideas</p>
                                </button>
                                {filteredTemplates.map((t) => (
                                    <TemplateCard
                                        key={t.id}
                                        template={t}
                                        onSelect={selectTemplate}
                                        onPreview={() => window.open(`/api/templates/${t.id}/preview`, '_blank')}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                                <Layout className="w-12 h-12 text-gray-200 mb-4" />
                                <h3 className="font-bold text-gray-900">No templates found</h3>
                                <p className="text-gray-500 text-sm mt-1">Try a different search term or start from scratch.</p>
                                <button
                                    onClick={() => setTemplateSearch("")}
                                    className="mt-4 text-blue-600 text-sm font-semibold hover:underline"
                                >
                                    Clear search
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {currentStep === "RECIPIENTS" && (
                    <div className="p-8 flex flex-col flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Select Recipients</h2>
                                <p className="text-gray-500 text-sm mt-1">Choose which list to send to</p>
                            </div>

                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search lists..."
                                    value={listSearch}
                                    onChange={(e) => setListSearch(e.target.value)}
                                    className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        {isLoadingLists ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                                        <div className="w-12 h-12 bg-gray-50 rounded-xl mb-4" />
                                        <div className="space-y-3">
                                            <div className="h-4 bg-gray-100 rounded-full w-2/3" />
                                            <div className="h-3 bg-gray-50 rounded-full w-full" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredLists.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredLists.map((list) => (
                                    <button
                                        key={list.id}
                                        onClick={() => selectList(list)}
                                        className={`group relative text-left p-6 rounded-2xl border transition-all ${formData.recipientListId === list.id
                                            ? "border-blue-600 bg-blue-50/10 ring-4 ring-blue-50"
                                            : "border-gray-100 hover:border-blue-200 hover:bg-gray-50/30"
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${formData.recipientListId === list.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500"
                                            }`}>
                                            <Users className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-bold text-gray-900 truncate">{list.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{list.contactCount} recipients</p>

                                        {formData.recipientListId === list.id && (
                                            <div className="absolute top-4 right-4 text-blue-600">
                                                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center">
                                                    <Check className="w-4 h-4" />
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                                <Users className="w-12 h-12 text-gray-200 mb-4" />
                                <h3 className="font-bold text-gray-900">No contact lists found</h3>
                                <p className="text-gray-500 text-sm mt-1">Create a list in the Contacts tab first.</p>
                                <Link
                                    href="/dashboard/contacts"
                                    className="mt-4 inline-flex items-center gap-2 text-blue-600 text-sm font-semibold hover:underline"
                                >
                                    Go to Contacts
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {currentStep === "CONTENT" && (
                    <div className="p-8 flex flex-col flex-1">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Edit Content</h2>
                            <p className="text-gray-500 text-sm mt-1">Customize your email message</p>
                        </div>

                        <div className="flex-1 border border-gray-100 rounded-2xl overflow-hidden flex flex-col">
                            <div className="bg-gray-50 border-b border-gray-100 p-2 flex items-center gap-2">
                                <div className="px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider">HTML Editor</div>
                            </div>
                            <textarea
                                className="flex-1 w-full p-6 font-mono text-sm resize-none focus:outline-none bg-white"
                                value={formData.htmlContent}
                                onChange={e => setFormData({ ...formData, htmlContent: e.target.value })}
                                placeholder="Your email HTML content..."
                            />
                        </div>

                        <div className="mt-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-blue-900">Pro Tip</p>
                                    <p className="text-xs text-blue-700 mt-0.5">You can use double curly braces for personalization, like &#x7B;&#x7B;firstName&#x7D;&#x7D; or &#x7B;&#x7B;email&#x7D;&#x7D;.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === "REVIEW" && (
                    <div className="p-8 flex-1 flex flex-col">
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-gray-900">Review & {isEditing ? "Save" : "Create"}</h2>
                            <p className="text-gray-500 text-sm mt-1">Double check everything before saving</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                            <div className="space-y-6">
                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Settings className="w-4 h-4" />
                                        Settings
                                    </h3>
                                    <dl className="space-y-4">
                                        <div>
                                            <dt className="text-xs text-gray-500">Campaign Name</dt>
                                            <dd className="text-sm font-semibold text-gray-900">{formData.name}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-gray-500">Subject Line</dt>
                                            <dd className="text-sm font-semibold text-gray-900">{formData.subject}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-gray-500">From</dt>
                                            <dd className="text-sm font-semibold text-gray-900">{formData.fromName} &lt;{formData.fromEmail}&gt;</dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Recipients
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">
                                                {lists.find(l => l.id === formData.recipientListId)?.name || "Unknown List"}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {lists.find(l => l.id === formData.recipientListId)?.contactCount || 0} recipients
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Layout className="w-4 h-4" />
                                    Content Preview
                                </h3>
                                <div className="flex-1 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                    <div className="h-full w-full bg-gray-50 p-4 overflow-auto">
                                        <div
                                            className="bg-white shadow-sm rounded-lg p-6 min-h-[300px] text-sm"
                                            dangerouslySetInnerHTML={{ __html: formData.htmlContent }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Navigation */}
            <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-white/80 backdrop-blur-md border-t border-gray-100 py-4 px-8 flex items-center justify-between z-40">
                <button
                    onClick={handleBack}
                    disabled={currentStepIndex === 0 || mutation.isPending}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                {currentStep as string === "REVIEW" ? (
                    <button
                        onClick={() => mutation.mutate()}
                        disabled={mutation.isPending}
                        className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
                    >
                        {mutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                {isEditing ? "Update Campaign" : "Create Campaign"}
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        disabled={
                            (currentStep === "SETTINGS" && (!formData.name || !formData.subject || !formData.fromName || !formData.fromEmail)) ||
                            (currentStep === "TEMPLATE" && !formData.templateId) ||
                            (currentStep === "RECIPIENTS" && !formData.recipientListId) ||
                            (currentStep === "CONTENT" && !formData.htmlContent)
                        }
                        className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
                    >
                        Next Step
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
