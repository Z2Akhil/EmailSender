"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, RefreshCw, Globe, Loader2, Trash2, Copy } from "lucide-react";

type RecordStatus = "PASS" | "WARN" | "FAIL" | "UNCHECKED";

interface AuthRecord {
    status: RecordStatus;
    value?: string;
    message?: string;
    fix?: string;
}

interface Domain {
    _id: string;
    domainName: string;
    verificationStatus: "PENDING" | "VERIFIED" | "FAILED";
    dkimSelector?: string;
    spf?: AuthRecord;
    dkim?: AuthRecord;
    dmarc?: AuthRecord;
    lastCheckedAt?: string;
    createdAt: string;
}

interface DomainListProps {
    domains: Domain[];
    onRefresh: () => void;
}

const STATUS_STYLES: Record<RecordStatus, { badge: string; icon: typeof CheckCircle2; label: string }> = {
    PASS: { badge: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: CheckCircle2, label: "Pass" },
    WARN: { badge: "bg-amber-50 text-amber-700 border-amber-100", icon: AlertTriangle, label: "Warning" },
    FAIL: { badge: "bg-red-50 text-red-600 border-red-100", icon: AlertCircle, label: "Missing" },
    UNCHECKED: { badge: "bg-gray-50 text-gray-500 border-gray-100", icon: AlertCircle, label: "Not checked" },
};

/** SPF, DKIM and DMARC decide inbox vs spam more than anything in the message. */
function RecordRow({ name, purpose, record }: { name: string; purpose: string; record?: AuthRecord }) {
    const status = record?.status || "UNCHECKED";
    const style = STATUS_STYLES[status];
    const Icon = style.icon;

    return (
        <div className="py-4 first:pt-0 last:pb-0 border-b border-gray-50 last:border-0">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">{name}</span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${style.badge}`}>
                            <Icon className="w-3 h-3" />
                            {style.label}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{purpose}</p>
                </div>
            </div>

            {record?.message && <p className="text-xs text-gray-600 mt-2">{record.message}</p>}

            {record?.value && (
                <pre className="mt-2 text-[11px] font-mono text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 overflow-x-auto whitespace-pre-wrap break-all">
                    {record.value}
                </pre>
            )}

            {record?.fix && status !== "PASS" && (
                <div className="mt-2 flex items-start gap-2 text-xs text-blue-800 bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-2">
                    <span className="flex-1 break-words">{record.fix}</span>
                    <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(record.fix!)}
                        className="shrink-0 text-blue-600 hover:text-blue-800"
                        title="Copy"
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}
        </div>
    );
}

export function DomainList({ domains, onRefresh }: DomainListProps) {
    const [isRefreshing, setIsRefreshing] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [selectorDraft, setSelectorDraft] = useState<Record<string, string>>({});

    const recheck = async (id: string) => {
        setIsRefreshing(id);
        try {
            const selector = selectorDraft[id]?.trim();
            const url = selector
                ? `/api/domains/${id}/verify?selector=${encodeURIComponent(selector)}`
                : `/api/domains/${id}/verify`;
            const response = await fetch(url);
            const result = await response.json();
            if (!result.success) throw new Error(result.error);
            onRefresh();
        } catch (error) {
            console.error(error);
            alert("Could not check DNS for this domain.");
        } finally {
            setIsRefreshing(null);
        }
    };

    const handleDelete = async (id: string, domainName: string) => {
        if (!confirm(`Remove ${domainName} from this list?\n\nThis only stops checking its DNS — it changes nothing about your domain or your email account.`)) {
            return;
        }

        setIsDeleting(id);
        try {
            const response = await fetch(`/api/domains/${id}`, { method: "DELETE" });
            const result = await response.json();
            if (!result.success) throw new Error(result.error || "Failed to remove domain");
            onRefresh();
        } catch (error) {
            console.error(error);
            alert("Failed to remove domain.");
        } finally {
            setIsDeleting(null);
        }
    };

    if (domains.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Globe className="w-6 h-6 text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">No domains added yet</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                    Add the domain you send from and we&apos;ll check its SPF, DKIM and DMARC records —
                    the three DNS records that keep your campaigns out of the spam folder.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {domains.map((domain) => {
                const verified = domain.verificationStatus === "VERIFIED";
                return (
                    <div key={domain._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-gray-50">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                                    <span className="font-semibold text-gray-900 truncate">{domain.domainName}</span>
                                    <span
                                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${verified
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                            : "bg-amber-50 text-amber-700 border-amber-100"
                                            }`}
                                    >
                                        {verified ? "Authenticated" : "Needs attention"}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {domain.lastCheckedAt
                                        ? `Last checked ${new Date(domain.lastCheckedAt).toLocaleString()}`
                                        : "Not checked yet"}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={() => recheck(domain._id)}
                                    disabled={isRefreshing === domain._id}
                                    className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-60 transition-colors"
                                >
                                    {isRefreshing === domain._id
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <RefreshCw className="w-4 h-4" />}
                                    Re-check DNS
                                </button>
                                <button
                                    onClick={() => handleDelete(domain._id, domain.domainName)}
                                    disabled={isDeleting === domain._id}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl disabled:opacity-60 transition-colors"
                                    title="Remove domain"
                                >
                                    {isDeleting === domain._id
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <Trash2 className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="px-5 py-4">
                            <RecordRow
                                name="SPF"
                                purpose="Lists the servers allowed to send mail as your domain"
                                record={domain.spf}
                            />
                            <RecordRow
                                name={`DKIM${domain.dkimSelector ? ` (${domain.dkimSelector})` : ""}`}
                                purpose="Cryptographically signs your mail so it cannot be forged"
                                record={domain.dkim}
                            />
                            <RecordRow
                                name="DMARC"
                                purpose="Tells receivers what to do when SPF or DKIM fails"
                                record={domain.dmarc}
                            />
                        </div>

                        {/* DKIM selectors are provider-specific and cannot be discovered —
                            common ones are probed automatically, this covers the rest. */}
                        {domain.dkim?.status !== "PASS" && (
                            <div className="px-5 pb-5 flex flex-col sm:flex-row sm:items-center gap-2">
                                <input
                                    type="text"
                                    placeholder="DKIM selector from your provider, e.g. zoho or s1"
                                    value={selectorDraft[domain._id] ?? domain.dkimSelector ?? ""}
                                    onChange={(e) => setSelectorDraft({ ...selectorDraft, [domain._id]: e.target.value })}
                                    className="flex-1 bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                                />
                                <button
                                    onClick={() => recheck(domain._id)}
                                    disabled={isRefreshing === domain._id}
                                    className="px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 disabled:opacity-60 transition-colors whitespace-nowrap"
                                >
                                    Check this selector
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
