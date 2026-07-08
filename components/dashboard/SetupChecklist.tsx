"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { CheckCircle2, Circle, X, Sparkles } from "lucide-react";

export interface ChecklistState {
    hasContacts: boolean;
    hasSentCampaign: boolean;
    hasCustomDomain: boolean;
    whatsappConnected: boolean;
    dismissed: boolean;
}

interface Props {
    checklist: ChecklistState;
}

export function SetupChecklist({ checklist }: Props) {
    const queryClient = useQueryClient();

    const coreDone = checklist.hasContacts && checklist.hasSentCampaign;
    if (checklist.dismissed || coreDone) return null;

    const items = [
        { done: checklist.hasContacts, label: "Add your contacts", href: "/dashboard/contacts", core: true },
        { done: checklist.hasSentCampaign, label: "Send your first campaign", href: "/dashboard/campaigns/new", core: true },
        { done: checklist.hasCustomDomain, label: "Verify a custom domain", href: "/dashboard/settings/domains", core: false },
        { done: checklist.whatsappConnected, label: "Connect WhatsApp", href: "/dashboard/settings/whatsapp", core: false },
    ];
    const doneCount = items.filter(i => i.done).length;

    const dismiss = async () => {
        // Optimistic hide, then persist
        queryClient.setQueryData(["dashboard-stats"], (old: any) =>
            old ? { ...old, data: { ...old.data, checklist: { ...old.data.checklist, dismissed: true } } } : old
        );
        await fetch("/api/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "dismiss-checklist" }),
        });
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 relative">
            <button
                onClick={dismiss}
                className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors"
                title="Dismiss"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-gray-900 text-sm">Getting started</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">{doneCount} of {items.length} done</p>

            <div className="h-1.5 bg-gray-100 rounded-full mb-5 overflow-hidden">
                <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${(doneCount / items.length) * 100}%` }}
                />
            </div>

            <ul className="space-y-3">
                {items.map(item => (
                    <li key={item.label}>
                        <Link
                            href={item.href}
                            className={`flex items-center gap-2.5 text-sm transition-colors ${item.done ? "text-gray-400 line-through" : "text-gray-700 hover:text-blue-600 font-medium"}`}
                        >
                            {item.done
                                ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                : <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                            {item.label}
                            {!item.core && !item.done && (
                                <span className="ml-auto text-[10px] uppercase font-bold text-gray-300">optional</span>
                            )}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
