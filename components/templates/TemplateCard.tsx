"use client";

import { Eye, Copy, Plus } from "lucide-react";
import { Template } from "@/types";

interface TemplateCardProps {
    template: Template;
    onSelect?: (template: Template) => void;
    onPreview?: (template: Template) => void;
    showActions?: boolean;
}

export function TemplateCard({ template, onSelect, onPreview, showActions = true }: TemplateCardProps) {
    return (
        <div className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-blue-200 hover:shadow-sm transition-all flex flex-col">
            {/* Thumbnail Placeholder */}
            <div className="aspect-[4/5] bg-gray-50 relative overflow-hidden group-hover:bg-blue-50/30 transition-colors">
                {template.thumbnail ? (
                    <img
                        src={template.thumbnail}
                        alt={template.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3">
                            <Eye className="w-6 h-6 text-gray-300 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">No Preview</p>
                    </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
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
                    <h3 className="text-gray-900 font-semibold truncate" title={template.name}>
                        {template.name}
                    </h3>
                    {template.description && (
                        <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                            {template.description}
                        </p>
                    )}
                </div>

                {showActions && (
                    <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${template.isGlobal ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"
                            }`}>
                            {template.isGlobal ? "Official" : "My Template"}
                        </span>

                        <div className="flex items-center gap-1">
                            <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
