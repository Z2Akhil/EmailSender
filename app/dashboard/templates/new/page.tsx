"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, PenLine, Loader2, MessageCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import type { SimpleEmailEditorRef } from "@/components/templates/SimpleEmailEditor";

const SimpleEmailEditor = dynamic(
    () => import("@/components/templates/SimpleEmailEditor").then(mod => mod.SimpleEmailEditor),
    { ssr: false, loading: () => <div className="min-h-[420px] bg-gray-50 rounded-2xl animate-pulse" /> }
);
const WhatsappTemplateBuilder = dynamic(
    () => import("@/components/templates/WhatsappTemplateBuilder").then(mod => mod.WhatsappTemplateBuilder),
    { ssr: false, loading: () => <div className="min-h-[420px] bg-gray-50 rounded-2xl animate-pulse" /> }
);

function ModeChooser() {
    return (
        <div className="max-w-3xl mx-auto py-10">
            <div className="text-center mb-10">
                <h1 className="text-2xl font-bold text-gray-900">Create a Template</h1>
                <p className="text-gray-500 mt-2">How would you like to design your email?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                    href="/dashboard/templates/new?mode=simple"
                    className="group bg-white rounded-3xl border-2 border-gray-100 p-8 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-50 transition-all text-left"
                >
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                        <PenLine className="w-7 h-7" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">Email Template</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Write your email like a document. Add images, buttons and personalization
                        with one click. No design skills needed.
                    </p>
                </Link>

                <Link
                    href="/dashboard/templates/new?mode=whatsapp"
                    className="group bg-white rounded-3xl border-2 border-gray-100 p-8 hover:border-green-500 hover:shadow-lg hover:shadow-green-50 transition-all text-left"
                >
                    <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                        <MessageCircle className="w-7 h-7" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">WhatsApp Template</h2>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Build a Meta message template with live phone preview and submit it
                        for approval — without leaving BulkMailer.
                    </p>
                </Link>
            </div>

            <p className="text-center text-sm text-gray-400 mt-8">
                <Link href="/dashboard/templates" className="hover:text-gray-600 underline">
                    ← Back to templates
                </Link>
            </p>
        </div>
    );
}

function CreateTemplateInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const mode = searchParams.get("mode");

    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const simpleRef = useRef<SimpleEmailEditorRef>(null);

    const createTemplateMutation = useMutation({
        mutationFn: async () => {
            if (!simpleRef.current || simpleRef.current.isEmpty()) {
                throw new Error("Email content cannot be empty.");
            }
            const exported = simpleRef.current.getHtml();
            const finalHtml = exported.html;
            // Tagged so the campaign editor knows this is TipTap JSON
            const finalDesign = { editor: "tiptap", content: exported.json };

            const payload = {
                name,
                description,
                htmlContent: finalHtml,
                emailDesign: finalDesign,
            };

            const res = await fetch("/api/templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to create template");
            return json;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["templates"] });
            toast.success("Template created successfully!");
            router.push("/dashboard/templates");
        },
        onError: (err: any) => {
            toast.error(err.message || "Something went wrong.");
        }
    });

    if (mode === "whatsapp") {
        // Self-contained: has its own header, submit button and Meta flow
        return <WhatsappTemplateBuilder />;
    }

    if (mode !== "simple") {
        return <ModeChooser />;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] -m-4 sm:-m-6 lg:-m-8">
            {/* Header */}
            <div className="flex-none bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push("/dashboard/templates/new")}
                        className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
                        title="Back to editor choice"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Email Template</h1>
                        <p className="text-xs text-gray-500">Design a reusable layout for your campaigns</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            placeholder="Template Name..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-medium text-gray-900 w-48"
                        />
                        <input
                            type="text"
                            placeholder="Description (Optional)"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all text-gray-700 w-64 hidden sm:block"
                        />
                    </div>

                    <button
                        onClick={() => createTemplateMutation.mutate()}
                        disabled={createTemplateMutation.isPending || !name}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
                    >
                        <Save className="w-4 h-4" />
                        {createTemplateMutation.isPending ? "Saving..." : "Save Template"}
                    </button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-auto bg-gray-100 relative p-4">
                <div className="max-w-4xl mx-auto h-full">
                    <SimpleEmailEditor ref={simpleRef} />
                </div>
            </div>
        </div>
    );
}

export default function CreateTemplatePage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        }>
            <CreateTemplateInner />
        </Suspense>
    );
}
