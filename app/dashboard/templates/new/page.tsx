"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import type { EmailEditorWrapperRef } from "@/components/campaigns/EmailEditorWrapper";

const EmailEditorWrapper = dynamic(
    () => import("@/components/campaigns/EmailEditorWrapper").then(mod => mod.EmailEditorWrapper),
    { ssr: false }
);

export default function CreateTemplatePage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    
    // We don't expose HTML to users anymore as it's fully managed by GrapesJS now
    const emailEditorRef = useRef<EmailEditorWrapperRef>(null);

    const createTemplateMutation = useMutation({
        mutationFn: async () => {
            let finalHtml = "";
            let finalDesign = null;

            if (emailEditorRef.current) {
                const exported = await emailEditorRef.current.exportHtml();
                if (exported.html && exported.design) {
                    finalHtml = exported.html;
                    finalDesign = exported.design;
                }
            }

            if (!finalHtml) throw new Error("Email content cannot be empty.");

            const payload = {
                name,
                description,
                htmlContent: finalHtml,
                emailDesign: finalDesign
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

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] -m-4 sm:-m-6 lg:-m-8">
            {/* Header */}
            <div className="flex-none bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.push("/dashboard/templates")}
                        className="p-2 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Create Template</h1>
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
            <div className="flex-1 overflow-hidden bg-gray-100 relative">
                <EmailEditorWrapper ref={emailEditorRef} />
            </div>
        </div>
    );
}
