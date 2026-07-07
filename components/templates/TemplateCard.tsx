"use client";

import { Eye, Plus, MessageCircle, Mail, Trash2 } from "lucide-react";
import { Template } from "@/types";

interface TemplateCardProps {
    template: Template;
    onSelect?: (template: Template) => void;
    onPreview?: (template: Template) => void;
    onDelete?: (template: Template) => void;
    showActions?: boolean;
    layout?: "grid" | "list";
}

export function TemplateCard({
    template,
    onSelect,
    onPreview,
    onDelete,
    showActions = true,
    layout = "grid"
}: TemplateCardProps) {
    if (layout === "list") {
        return (
            <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-blue-200 hover:shadow-sm transition-all flex items-center p-4 gap-4">
                <div className="w-20 h-24 bg-gray-50 rounded-xl relative overflow-hidden flex-shrink-0">
                    {template.thumbnail ? (
                        <img
                            src={template.thumbnail}
                            alt={template.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            {template.type === "WHATSAPP" ? (
                                <MessageCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <Eye className="w-5 h-5 text-gray-300" />
                            )}
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-gray-900 font-semibold truncate" title={template.name}>
                            {template.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${template.type === "WHATSAPP" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                            }`}>
                            {template.type === "WHATSAPP" ? "WhatsApp" : "Email"}
                        </span>
                    </div>
                    {template.description && (
                        <p className="text-gray-500 text-xs line-clamp-1">
                            {template.description}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {onPreview && (
                        <button
                            onClick={() => onPreview(template)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                            title="Preview"
                        >
                            <Eye className="w-5 h-5" />
                        </button>
                    )}
                    {onDelete && !template.isGlobal && (
                        <button
                            onClick={() => onDelete(template)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                            title="Delete template"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                    {onSelect && (
                        <button
                            onClick={() => onSelect(template)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            Select
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-blue-200 hover:shadow-sm transition-all flex flex-col h-full">
            {/* Thumbnail Placeholder or Iframe Preview */}
            <div className="aspect-[4/5] bg-gray-50 relative overflow-hidden group-hover:bg-blue-50/30 transition-colors">
                {template.thumbnail ? (
                    <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 w-full h-full bg-gray-50 flex items-center justify-center">
                        {template.type === "WHATSAPP" ? (
                            <div className="flex flex-col items-center text-center p-6 opacity-40">
                                <MessageCircle className="w-16 h-16 text-green-500 mb-3" />
                                <p className="text-xs font-medium text-green-600 uppercase tracking-wider">WhatsApp Template</p>
                            </div>
                        ) : (
                            <>
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-0 opacity-20">
                                    <Eye className="w-12 h-12 text-gray-300" />
                                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mt-2">Preview Loading...</p>
                                </div>
                                {/* Iframe Preview */}
                                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none origin-top-left" style={{ transform: 'scale(0.5)', width: '200%', height: '200%' }}>
                                    <iframe
                                        src={`/api/templates/${template.id}/preview`}
                                        className="w-full h-full border-none"
                                        title={template.name}
                                        scrolling="no"
                                    />
                                </div>
                            </>
                        )}
                        {/* Overlay to catch clicks and prevent iframe interaction */}
                        <div className="absolute inset-0 z-10" />
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-20">
                    {onPreview && (
                        <button
                            onClick={() => onPreview(template)}
                            className="p-2.5 bg-white rounded-xl text-gray-900 hover:bg-gray-50 transition-colors shadow-lg"
                            title="Preview"
                        >
                            <Eye className="w-5 h-5" />
                        </button>
                    )}
                    {onSelect && (
                        <button
                            onClick={() => onSelect(template)}
                            className="p-2.5 bg-blue-600 rounded-xl text-white hover:bg-blue-700 transition-colors shadow-lg"
                            title="Use Template"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="p-4 flex-1 flex flex-col">
                <div className="mb-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-gray-900 font-semibold truncate flex-1" title={template.name}>
                            {template.name}
                        </h3>
                        {onPreview && (
                            <button
                                onClick={() => onPreview(template)}
                                className="sm:hidden p-1.5 text-gray-400 hover:text-blue-600 rounded-lg"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {template.description && (
                        <p className="text-gray-500 text-xs line-clamp-2">
                            {template.description}
                        </p>
                    )}
                </div>

                <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${template.type === "WHATSAPP" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                        }`}>
                        {template.type === "WHATSAPP" ? <MessageCircle className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                        {template.type === "WHATSAPP" ? "WhatsApp" : "Email"}
                    </span>

                    <div className="flex items-center gap-2">
                        {onPreview && (
                            <button
                                onClick={() => onPreview(template)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Open Preview"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                        )}
                        {onDelete && !template.isGlobal && (
                            <button
                                onClick={() => onDelete(template)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete template"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <button
                            onClick={() => onSelect?.(template)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Select"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
