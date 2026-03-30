"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import MetaAssetSelector from "./MetaAssetSelector";

interface Props {
    initialPhoneNumberId: string;
    initialBusinessAccountId: string;
    isConfigured: boolean;
    oauthSuccess?: boolean;
    oauthError?: string;
    initialStep?: string;
}

export default function WhatsappSettingsForm({
    initialPhoneNumberId,
    initialBusinessAccountId,
    isConfigured,
    oauthSuccess,
    oauthError,
    initialStep
}: Props) {
    const [step, setStep] = useState(initialStep || "connect");
    const [isLoading, setIsLoading] = useState(false);
    const [statusMatch, setStatusMatch] = useState<{ type: "success" | "error"; message: string } | null>(null);

    useEffect(() => {
        if (oauthSuccess) {
            setStatusMatch({ type: "success", message: "Successfully connected with Meta!" });
        } else if (oauthError) {
            const errorMessages: Record<string, string> = {
                oauth_denied: "You denied the Meta OAuth request.",
                missing_code: "Invalid response from Meta.",
                missing_env: "OAuth is not configured properly on the server.",
                token_exchange_failed: "Failed to authenticate with Meta.",
                no_business_found: "No Meta Business Account found. Make sure you have created one.",
                no_waba_found: "No WhatsApp Business Account found in your Meta Business portfolio.",
                no_phone_number_found: "No WhatsApp phone number found in your Meta Account.",
                server_error: "An internal server error occurred during authentication."
            };
            setStatusMatch({ type: "error", message: errorMessages[oauthError] || "An unknown error occurred during Meta authentication." });
        }
    }, [oauthSuccess, oauthError]);

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

            {step === "select_asset" ? (
                <MetaAssetSelector onComplete={() => {
                    setStep("connect");
                    setStatusMatch({ type: "success", message: "WhatsApp assets connected successfully! Refresh the page to see changes." });
                    // Optionally full router.refresh() here would be ideal, but showing success works too
                    setTimeout(() => window.location.href = "/dashboard/settings/whatsapp", 1500);
                }} />
            ) : (
                <>
                    {!isConfigured && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8 mt-4 flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex flex-col items-center justify-center mb-4">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.418-.099.824z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Meta Business Account</h3>
                            <p className="text-sm text-gray-500 mb-6 max-w-md">
                                The easiest way to configure WhatsApp. Connect your Meta account and we'll automatically fetch your Business Account ID, Phone Number ID, and a long-lived Access Token.
                            </p>
                            <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => {
                                    setIsLoading(true);
                                    window.location.href = "/api/whatsapp/oauth/login";
                                }}
                                className="inline-flex items-center justify-center bg-[#1877F2] hover:bg-[#166FE5] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#1877F2]/50 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                ) : (
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                )}
                                {isLoading ? "Redirecting to Meta..." : "Connect with Meta"}
                            </button>
                        </div>
                    )}

                    <details className="group">
                        <summary className="text-sm font-medium text-gray-700 cursor-pointer list-none flex items-center gap-2 select-none mb-4">
                            <svg className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            Advanced: Manual Setup
                        </summary>

                        <div className="space-y-4 pt-4 border-t border-gray-100 pl-6">
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
                            className="w-full sm:w-auto bg-gray-900 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all hover:bg-gray-800 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-6"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isLoading ? "Saving..." : "Save Manual Configuration"}
                        </button>
                    </details>
                </>
            )}
        </form>
    );
}
