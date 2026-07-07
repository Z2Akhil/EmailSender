"use client";

import { useState } from "react";
import { MoreVertical, Mail, Send, FileText, BarChart3, Clock, Loader2, MessageCircle } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Campaign } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CampaignCardProps {
    campaign: Campaign;
    onDelete?: (id: string) => void;
    onDuplicate?: (id: string) => void;
}

const STATUS_CONFIG = {
    DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-600", icon: FileText },
    SCHEDULED: { label: "Scheduled", color: "bg-blue-50 text-blue-600", icon: Clock },
    SENDING: { label: "Sending", color: "bg-purple-50 text-purple-600", icon: Loader2 },
    SENT: { label: "Sent", color: "bg-green-50 text-green-600", icon: Send },
    CANCELLED: { label: "Cancelled", color: "bg-red-50 text-red-600", icon: FileText },
};

export function CampaignCard({ campaign, onDelete, onDuplicate }: CampaignCardProps) {
    const queryClient = useQueryClient();
    const status = STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
    const StatusIcon = status.icon;
    const isWhatsapp = campaign.channel === "WHATSAPP";
    const [scheduleModal, setScheduleModal] = useState(false);
    const [scheduleAt, setScheduleAt] = useState("");

    const sendMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/campaigns/${campaign.id}/send`, { method: "POST" });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || "Failed to send campaign");
            }
            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["campaigns"] });
            alert(`Campaign dispatched! We've started sending to ${data.totalRecipients} recipients.`);
        },
        onError: (error: any) => {
            alert(`Failed to send: ${error.message}`);
        },
    });

    const scheduleMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/campaigns/${campaign.id}/schedule`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scheduledAt: new Date(scheduleAt).toISOString() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to schedule campaign");
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["campaigns"] });
            setScheduleModal(false);
            setScheduleAt("");
        },
        onError: (error: any) => alert(`Failed to schedule: ${error.message}`),
    });

    const unscheduleMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/campaigns/${campaign.id}/schedule`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to cancel schedule");
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
        onError: (error: any) => alert(`Failed to cancel schedule: ${error.message}`),
    });

    const isSending = campaign.status === 'SENDING';
    const progress = campaign.totalRecipients > 0
        ? Math.round((campaign.sentCount / campaign.totalRecipients) * 100)
        : 0;

    return (
        <div className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 ${status.color.split(' ')[0]} rounded-xl flex items-center justify-center transition-colors`}>
                    <StatusIcon className={`w-5 h-5 ${status.color.split(' ')[1]} ${isSending ? 'animate-spin' : ''}`} />
                </div>

                <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${status.color}`}>
                        {status.label}
                    </span>

                    <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 hover:bg-gray-100 rounded-lg transition-colors outline-none text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-5 h-5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem asChild className="cursor-pointer">
                                <Link href={`/dashboard/campaigns/${campaign.id}/edit`}>
                                    Edit Campaign
                                </Link>
                            </DropdownMenuItem>
                            {campaign.status === "DRAFT" && (
                                <DropdownMenuItem className="cursor-pointer" onClick={() => setScheduleModal(true)}>
                                    Schedule…
                                </DropdownMenuItem>
                            )}
                            {campaign.status === "SCHEDULED" && (
                                <DropdownMenuItem
                                    className="cursor-pointer"
                                    onClick={() => {
                                        if (confirm("Cancel the schedule and revert to draft?")) unscheduleMutation.mutate();
                                    }}
                                >
                                    Cancel Schedule
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="cursor-pointer" onClick={() => onDuplicate?.(campaign.id)}>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onClick={() => onDelete?.(campaign.id)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="mb-6">
                <div className="flex items-center gap-2">
                    {isWhatsapp ? (
                        <MessageCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                        <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    )}
                    <h3 className="text-gray-900 font-semibold truncate" title={campaign.name}>
                        {campaign.name}
                    </h3>
                </div>
                <p className="text-gray-500 text-sm mt-0.5 truncate">
                    {isWhatsapp ? "WhatsApp campaign" : campaign.subject}
                </p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-gray-50">
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recipients</p>
                    <p className="text-sm font-semibold text-gray-700">{campaign.totalRecipients?.toLocaleString() || 0}</p>
                </div>
                {campaign.status === 'SENT' ? (
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Open Rate</p>
                        <p className="text-sm font-semibold text-gray-700">
                            {campaign.totalRecipients > 0
                                ? `${((campaign.openCount / campaign.totalRecipients) * 100).toFixed(1)}%`
                                : '0%'
                            }
                        </p>
                    </div>
                ) : (
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {campaign.status === 'SCHEDULED' ? 'Scheduled For' : 'Updated At'}
                        </p>
                        <p className="text-sm font-semibold text-gray-700">
                            {new Date(campaign.scheduledAt || campaign.updatedAt).toLocaleDateString()}
                        </p>
                    </div>
                )}
            </div>

            {/* Progress Bar for Sending Status */}
            {isSending && (
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-bold text-purple-600 uppercase">Sending...</span>
                        <span className="text-[10px] font-bold text-purple-600 uppercase">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-purple-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-purple-600 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="flex gap-2">
                <Link
                    href={`/dashboard/campaigns/${campaign.id}${campaign.status === 'SENT' ? '/analytics' : '/edit'}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-50 text-gray-700 text-sm font-medium py-2 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                >
                    {campaign.status === 'SENT' ? 'View Report' : 'Continue Editing'}
                </Link>
                {campaign.status === 'DRAFT' && (
                    <button
                        onClick={() => {
                            if (confirm(`Send this campaign to ${campaign.totalRecipients || 'all'} recipients?`)) {
                                sendMutation.mutate();
                            }
                        }}
                        disabled={sendMutation.isPending}
                        className="flex-[1.2] inline-flex items-center justify-center gap-2 bg-blue-600 text-white text-sm font-semibold py-2 rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 disabled:opacity-50"
                    >
                        {sendMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                        Send Now
                    </button>
                )}
                {campaign.status === 'SENT' && (
                    <Link
                        href={`/dashboard/campaigns/${campaign.id}/analytics`}
                        className="p-2 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="View detailed analytics"
                    >
                        <BarChart3 className="w-5 h-5" />
                    </Link>
                )}
            </div>

            {/* Schedule Modal */}
            {scheduleModal && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Schedule Campaign</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Pick when &ldquo;{campaign.name}&rdquo; should be sent. It dispatches automatically at that time.
                        </p>
                        <input
                            type="datetime-local"
                            value={scheduleAt}
                            min={new Date(Date.now() + 5 * 60000).toISOString().slice(0, 16)}
                            onChange={e => setScheduleAt(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 mb-4"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setScheduleModal(false); setScheduleAt(""); }}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={!scheduleAt || scheduleMutation.isPending}
                                onClick={() => scheduleMutation.mutate()}
                                className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-6 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                            >
                                {scheduleMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                                {scheduleMutation.isPending ? "Scheduling..." : "Schedule"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
