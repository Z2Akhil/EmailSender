"use client";

import { MoreVertical, Mail, Calendar, Send, FileText, BarChart3, Clock } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Campaign } from "@/types";

interface CampaignCardProps {
    campaign: Campaign;
    onDelete?: (id: string) => void;
    onDuplicate?: (id: string) => void;
}

const STATUS_CONFIG = {
    DRAFT: { label: "Draft", color: "bg-gray-100 text-gray-600", icon: FileText },
    SCHEDULED: { label: "Scheduled", color: "bg-blue-50 text-blue-600", icon: Clock },
    SENDING: { label: "Sending", color: "bg-purple-50 text-purple-600", icon: Send },
    SENT: { label: "Sent", color: "bg-green-50 text-green-600", icon: Send },
    CANCELLED: { label: "Cancelled", color: "bg-red-50 text-red-600", icon: FileText },
};

export function CampaignCard({ campaign, onDelete, onDuplicate }: CampaignCardProps) {
    const status = STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.DRAFT;
    const StatusIcon = status.icon;

    return (
        <div className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 ${status.color.split(' ')[0]} rounded-xl flex items-center justify-center transition-colors`}>
                    <StatusIcon className={`w-5 h-5 ${status.color.split(' ')[1]}`} />
                </div>

                <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${status.color}`}>
                        {status.label}
                    </span>

                    <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 hover:bg-gray-100 rounded-lg transition-colors outline-none text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-5 h-5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem className="cursor-pointer">Edit Campaign</DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => onDuplicate?.(campaign.id)}>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onClick={() => onDelete?.(campaign.id)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-gray-900 font-semibold truncate" title={campaign.name}>
                    {campaign.name}
                </h3>
                <p className="text-gray-500 text-sm mt-0.5 truncate">{campaign.subject}</p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-gray-50">
                <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recipients</p>
                    <p className="text-sm font-semibold text-gray-700">{campaign.totalRecipients.toLocaleString()}</p>
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

            <div className="flex gap-2">
                <Link
                    href={`/dashboard/campaigns/${campaign.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-gray-50 text-gray-700 text-sm font-medium py-2 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                >
                    {campaign.status === 'SENT' ? 'View Report' : 'Continue Editing'}
                </Link>
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
        </div>
    );
}
