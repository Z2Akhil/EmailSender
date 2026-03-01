"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface Props {
    initialPhoneNumberId: string;
    initialBusinessAccountId: string;
    isConfigured: boolean;
}

export default function WhatsappSettingsForm({
    initialPhoneNumberId,
    initialBusinessAccountId,
    isConfigured
}: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const [statusMatch, setStatusMatch] = useState<{ type: "success" | "error"; message: string } | null>(null);

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setStatusMatch(null);

        const formData = new FormData(e.currentTarget);
        const data = {
            whatsappAccessToken: formData.get("whatsappAccessToken") as string,
            whatsappPhoneNumberId: formData.get("whatsappPhoneNumberId") as string,
            whatsappBusinessAccountId: formData.get("whatsappBusinessAccountId") as string,
        };

        try {
            const res = await fetch("/api/whatsapp/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (res.ok) {
                setStatusMatch({ type: "success", message: "WhatsApp credentials saved successfully" });
            } else {
                setStatusMatch({ type: "error", message: result.error || "Failed to save credentials" });
            }
        } catch (error) {
            setStatusMatch({ type: "error", message: "Something went wrong" });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {isConfigured && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    WhatsApp integration is currently active
                </div>
            )}

            {statusMatch && (
                <div className={`p-4 rounded-lg text-sm border ${statusMatch.type === "success"
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-700"
                    }`}>
                    {statusMatch.message}
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="whatsappAccessToken" className="block text-sm font-medium text-gray-700">System User Access Token</label>
                    <input
                        id="whatsappAccessToken"
                        name="whatsappAccessToken"
                        type="password"
                        placeholder="EAAI..."
                        required={!isConfigured} // Only required if not configured
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all block"
                    />
                    <p className="text-xs text-gray-500">
                        {isConfigured ? "Leave blank to keep current token. " : ""}
                        Generate a permanent token from Meta Developer Console.
                    </p>
                </div>

                <div className="space-y-2">
                    <label htmlFor="whatsappPhoneNumberId" className="block text-sm font-medium text-gray-700">Phone Number ID</label>
                    <input
                        id="whatsappPhoneNumberId"
                        name="whatsappPhoneNumberId"
                        placeholder="e.g. 1029384857"
                        defaultValue={initialPhoneNumberId}
                        required
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all block"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="whatsappBusinessAccountId" className="block text-sm font-medium text-gray-700">WhatsApp Business Account ID</label>
                    <input
                        id="whatsappBusinessAccountId"
                        name="whatsappBusinessAccountId"
                        placeholder="e.g. 192837465"
                        defaultValue={initialBusinessAccountId}
                        required
                        className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all block"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm shadow-blue-200 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? "Saving..." : "Save Configuration"}
            </button>
        </form>
    );
}
