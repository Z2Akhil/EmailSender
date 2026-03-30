"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface AssetData {
    businesses: { id: string; name: string }[];
    wabas: { id: string; name: string; businessId: string }[];
    phoneNumbers: { id: string; displayNumber: string; wabaId: string }[];
    expiresAt: string;
}

export default function MetaAssetSelector({ onComplete }: { onComplete: () => void }) {
    const [data, setData] = useState<AssetData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedBusinessId, setSelectedBusinessId] = useState<string>("");
    const [selectedWabaId, setSelectedWabaId] = useState<string>("");
    const [selectedPhoneId, setSelectedPhoneId] = useState<string>("");

    useEffect(() => {
        fetch("/api/whatsapp/assets")
            .then(res => res.json())
            .then(result => {
                if (result.error) throw new Error(result.error);
                setData(result);
                // Pre-select if only one option exists
                if (result.businesses.length === 1) setSelectedBusinessId(result.businesses[0].id);
            })
            .catch(err => setError(err.message))
            .finally(() => setIsLoading(false));
    }, []);

    // Also auto-select cascade if possible
    useEffect(() => {
        if (data && selectedBusinessId) {
            const availWabas = data.wabas.filter(w => w.businessId === selectedBusinessId);
            if (availWabas.length === 1) setSelectedWabaId(availWabas[0].id);
            else if (!availWabas.some(w => w.id === selectedWabaId)) setSelectedWabaId("");
        }
    }, [selectedBusinessId, data]);

    useEffect(() => {
        if (data && selectedWabaId) {
            const availPhones = data.phoneNumbers.filter(p => p.wabaId === selectedWabaId);
            if (availPhones.length === 1) setSelectedPhoneId(availPhones[0].id);
            else if (!availPhones.some(p => p.id === selectedPhoneId)) setSelectedPhoneId("");
        }
    }, [selectedWabaId, data]);


    const handleSave = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/whatsapp/select-asset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    businessId: selectedBusinessId,
                    wabaId: selectedWabaId,
                    phoneNumberId: selectedPhoneId
                }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error);
            onComplete();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <p className="font-semibold mb-2">Error loading assets</p>
                <p>{error}</p>
                <div className="mt-4">
                    <a href="/api/whatsapp/oauth/login" className="text-blue-600 underline">Try reconnecting with Meta</a>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const availableWabas = data.wabas.filter(w => w.businessId === selectedBusinessId);
    const availablePhones = data.phoneNumbers.filter(p => p.wabaId === selectedWabaId);

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Select WhatsApp Number</h3>
            <p className="text-sm text-gray-500 mb-6">Choose the exact WhatsApp phone number you want to connect to this workspace.</p>

            <div className="space-y-5">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Meta Business Portfolio</label>
                    <select
                        value={selectedBusinessId}
                        onChange={(e) => setSelectedBusinessId(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 appearance-none bg-gray-50 bg-none"
                    >
                        <option value="" disabled>Select a Business</option>
                        {data.businesses.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>

                {selectedBusinessId && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-medium text-gray-700">WhatsApp Business Account (WABA)</label>
                        <select
                            value={selectedWabaId}
                            onChange={(e) => setSelectedWabaId(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 appearance-none bg-gray-50 bg-none"
                        >
                            <option value="" disabled>Select a WABA</option>
                            {availableWabas.length === 0 && <option disabled>No WABAs found in this business</option>}
                            {availableWabas.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {selectedWabaId && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                        <select
                            value={selectedPhoneId}
                            onChange={(e) => setSelectedPhoneId(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 appearance-none bg-white"
                        >
                            <option value="" disabled>Select Phone Number</option>
                            {availablePhones.length === 0 && <option disabled>No numbers found in this WABA</option>}
                            {availablePhones.map(p => (
                                <option key={p.id} value={p.id}>{p.displayNumber}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="pt-4 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={!selectedPhoneId || isSaving}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isSaving ? "Finalizing..." : "Connect Number"}
                    </button>
                </div>
            </div>
        </div>
    );
}
