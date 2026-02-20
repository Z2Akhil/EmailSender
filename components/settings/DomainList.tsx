"use client";

import { useState } from "react";
import { CheckCircle2, Clock, AlertCircle, Copy, RefreshCw, ChevronDown, ChevronUp, Globe, Loader2, Trash2 } from "lucide-react";

interface Domain {
    _id: string;
    domainName: string;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
    verificationToken?: string;
    createdAt: string;
}

interface DomainListProps {
    domains: Domain[];
    onRefresh: () => void;
}

export function DomainList({ domains, onRefresh }: DomainListProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        // Fallback if toast hook doesn't exist or is different
        alert(`${label} copied to clipboard!`);
    };

    const verifyStatus = async (id: string) => {
        setIsRefreshing(id);
        try {
            const response = await fetch(`/api/domains/${id}/verify`);
            const result = await response.json();

            if (result.success) {
                onRefresh();
                if (result.status === "VERIFIED") {
                    alert("Domain verified successfully!");
                } else {
                    alert("Domain still pending verification. Please ensure DNS records are correct.");
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error(error);
            alert("Failed to verify status. Please try again later.");
        } finally {
            setIsRefreshing(null);
        }
    };

    if (domains.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-6 h-6 text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">No domains added yet</h3>
                <p className="text-gray-500 text-sm max-w-xs mx-auto mb-6">
                    Add a sending domain to start sending emails from your own brand.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {domains.map((domain) => (
                <div
                    key={domain._id}
                    className={`bg-white rounded-2xl border transition-all overflow-hidden ${expandedId === domain._id ? "border-blue-200 ring-4 ring-blue-50" : "border-gray-100"
                        }`}
                >
                    <div
                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                        onClick={() => toggleExpand(domain._id)}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${domain.verificationStatus === "VERIFIED" ? "bg-emerald-50 text-emerald-600" :
                                domain.verificationStatus === "FAILED" ? "bg-red-50 text-red-600" :
                                    "bg-blue-50 text-blue-600"
                                }`}>
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{domain.domainName}</h3>
                                <p className="text-xs text-gray-400">Added on {new Date(domain.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${domain.verificationStatus === "VERIFIED" ? "bg-emerald-50 text-emerald-700" :
                                domain.verificationStatus === "FAILED" ? "bg-red-50 text-red-700" :
                                    "bg-amber-50 text-amber-700"
                                }`}>
                                {domain.verificationStatus === "VERIFIED" ? (
                                    <><CheckCircle2 className="w-3.5 h-3.5" /> Verified</>
                                ) : domain.verificationStatus === "FAILED" ? (
                                    <><AlertCircle className="w-3.5 h-3.5" /> Failed</>
                                ) : (
                                    <><Clock className="w-3.5 h-3.5" /> Pending</>
                                )}
                            </div>
                            {expandedId === domain._id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                        </div>
                    </div>

                    {expandedId === domain._id && (
                        <div className="px-5 pb-6 border-t border-gray-50">
                            {domain.verificationStatus !== "VERIFIED" ? (
                                <div className="mt-4 space-y-4">
                                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                                        <p className="text-sm text-blue-800 font-medium mb-1">Verification Required</p>
                                        <p className="text-xs text-blue-600">
                                            Add the following TXT record to your DNS settings (GoDaddy, Cloudflare, etc.) to verify ownership.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5 ml-1">TXT Record</label>
                                            <div className="flex gap-2">
                                                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-mono text-sm text-gray-600 overflow-x-auto whitespace-nowrap">
                                                    _amazonses.{domain.domainName}
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(`_amazonses.${domain.domainName}`, "Host"); }}
                                                    className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5 ml-1">Value / Points To</label>
                                            <div className="flex gap-2">
                                                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 font-mono text-sm text-gray-600 overflow-x-auto whitespace-nowrap">
                                                    {domain.verificationToken}
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(domain.verificationToken || "", "Value"); }}
                                                    className="p-3 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4">
                                        <p className="text-xs text-gray-400 italic">
                                            DNS changes can take up to 48 hours to propagate.
                                        </p>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); verifyStatus(domain._id); }}
                                            disabled={isRefreshing === domain._id}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        >
                                            {isRefreshing === domain._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                            Verify Now
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-6">
                                    <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800">
                                        <CheckCircle2 className="w-5 h-5" />
                                        <div className="text-sm">
                                            <p className="font-semibold">Domain Verified</p>
                                            <p className="text-emerald-700/80">This domain is ready to be used as a sending identity in your campaigns.</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                        <button className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-medium transition-colors">
                                            <Trash2 className="w-4 h-4" /> Remove Domain
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
