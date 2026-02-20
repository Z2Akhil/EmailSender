"use client";

import { useState, useEffect } from "react";
import { Plus, ChevronLeft, ShieldCheck, Info } from "lucide-react";
import Link from "next/link";
import { DomainList } from "@/components/settings/DomainList";
import { AddDomainModal } from "@/components/settings/AddDomainModal";

export default function DomainsSettingsPage() {
    const [domains, setDomains] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchDomains = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/domains");
            const result = await response.json();
            if (result.success) {
                setDomains(result.data);
            }
        } catch (error) {
            console.error("Failed to fetch domains:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDomains();
    }, []);

    return (
        <div className="max-w-4xl mx-auto pb-20">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/dashboard/settings"
                    className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors group"
                >
                    <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Settings
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sending Domains</h1>
                        <p className="text-gray-500 mt-1">Authenticate your domains to improve email deliverability</p>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm shadow-blue-200 transition-all active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        Add Domain
                    </button>
                </div>
            </div>

            {/* Info Box */}
            <div className="mb-8 bg-blue-50/50 border border-blue-100 rounded-2xl p-6 flex gap-4">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h3 className="text-blue-900 font-semibold mb-1 flex items-center gap-2">
                        Why authenticate domains? <Info className="w-3.5 h-3.5 opacity-50" />
                    </h3>
                    <p className="text-blue-700/80 text-sm leading-relaxed">
                        Authenticating your domain tells mailbox providers (like Gmail or Outlook) that you are the legitimate sender.
                        This significantly reduces the chances of your emails landing in the spam folder.
                    </p>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2].map((i) => (
                        <div key={i} className="bg-gray-50 h-24 rounded-2xl animate-pulse border border-gray-100" />
                    ))}
                </div>
            ) : (
                <DomainList domains={domains} onRefresh={fetchDomains} />
            )}

            {/* Modal */}
            <AddDomainModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={(newDomain) => {
                    setDomains([newDomain, ...domains]);
                }}
            />
        </div>
    );
}
