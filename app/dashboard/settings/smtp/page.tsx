"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Loader2, Save, Server, ShieldCheck, Mail, Info, Trash2 } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiResponse } from "@/types";

interface SMTPInfo {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpSecure: boolean;
    smtpPass?: string;
}

export default function SMTPSettingsPage() {
    const queryClient = useQueryClient();

    // Form state
    const [formData, setFormData] = useState({
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpPass: "",
        smtpSecure: true,
    });

    // Track if password was modified by user
    const [isPasswordModified, setIsPasswordModified] = useState(false);
    const [testRecipient, setTestRecipient] = useState("");

    // Fetch existing settings
    const { data: smtpData, isLoading } = useQuery<ApiResponse<SMTPInfo>>({
        queryKey: ["settings-smtp"],
        queryFn: async () => {
            const res = await fetch("/api/settings/smtp");
            return res.json();
        },
    });

    // Populate form when data loads
    useEffect(() => {
        if (smtpData?.data) {
            setFormData({
                smtpHost: smtpData.data.smtpHost || "",
                smtpPort: smtpData.data.smtpPort || 587,
                smtpUser: smtpData.data.smtpUser || "",
                smtpSecure: smtpData.data.smtpSecure ?? true,
                smtpPass: smtpData.data.smtpPass || "", // Will be "••••••••" from API
            });
            setIsPasswordModified(false);
        }
    }, [smtpData]);

    // Save mutation with correct flags
    const saveMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/settings/smtp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    smtpHost: formData.smtpHost,
                    smtpPort: formData.smtpPort || 587,
                    smtpUser: formData.smtpUser,
                    smtpSecure: formData.smtpSecure || true,
                    smtpPass: isPasswordModified ? formData.smtpPass : "••••••••",
                    testOnly: false,
                    sendTestEmail: false,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to save SMTP settings");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings-smtp"] });
            setIsPasswordModified(false);
            alert("SMTP settings saved successfully!");
        },
        onError: (error: any) => {
            alert(error.message);
        }
    });

    // Test/Verify mutation
    const testMutation = useMutation({
        mutationFn: async (mode: "verify" | "send") => {
            const res = await fetch("/api/settings/smtp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    smtpHost: formData.smtpHost,
                    smtpPort: formData.smtpPort,
                    smtpUser: formData.smtpUser,
                    smtpSecure: formData.smtpSecure,
                    smtpPass: isPasswordModified ? formData.smtpPass : "••••••••",
                    testOnly: mode === "verify",
                    sendTestEmail: mode === "send",
                    testRecipient: mode === "send" ? testRecipient : undefined,
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Action failed");
            }
            return res.json();
        },
        onSuccess: (data) => {
            alert(data.message || "Action successful!");
            if (data.message?.includes("sent")) {
                setTestRecipient(""); // Clear after success
            }
        },
        onError: (error: any) => {
            alert(error.message);
        }
    });

    // Remove the saved server — sending falls back to the platform provider.
    const deleteMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/settings/smtp", { method: "DELETE" });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to remove SMTP settings");
            return json;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["settings-smtp"] });
            setFormData({ smtpHost: "", smtpPort: 587, smtpUser: "", smtpPass: "", smtpSecure: true });
            setIsPasswordModified(false);
            alert(data.message || "SMTP configuration removed.");
        },
        onError: (error: any) => alert(error.message),
    });

    // Only what the server has saved counts as configured — not what is typed.
    const isConfigured = !!smtpData?.data?.smtpHost;

    const handleRemove = () => {
        if (!confirm(
            `Remove the SMTP configuration for ${smtpData?.data?.smtpHost}?\n\n` +
            "Campaigns will send through the platform's provider instead. You can add a server again at any time."
        )) return;
        deleteMutation.mutate();
    };

    // Email validation helper
    const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading SMTP settings...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pb-20">
            <div className="mb-8">
                <Link
                    href="/dashboard/settings"
                    className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors group"
                >
                    <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Settings
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">SMTP Settings</h1>
                <p className="text-gray-500 mt-1">Configure your own email server for maximum deliverability</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
                <div className="flex items-center gap-4 pb-6 border-b border-gray-50">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <Server className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">Outgoing Mail Server</h3>
                        <p className="text-xs text-gray-500">These settings will override SES for campaign sending</p>
                    </div>
                    {isConfigured && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full shrink-0">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            Active
                        </span>
                    )}
                </div>

                {/* Configured state: edit the fields below, or drop the server
                    entirely and fall back to the platform provider. */}
                {isConfigured && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl">
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 font-mono truncate">
                                {smtpData?.data?.smtpHost}:{smtpData?.data?.smtpPort}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {smtpData?.data?.smtpUser} · {smtpData?.data?.smtpSecure ? "SSL/TLS" : "STARTTLS"} · edit
                                any field below and save to change it
                            </p>
                        </div>
                        <button
                            onClick={handleRemove}
                            disabled={deleteMutation.isPending}
                            className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-60 transition-colors"
                        >
                            {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                            Remove
                        </button>
                    </div>
                )}

                {/* Presets */}
                <div className="flex flex-wrap gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider w-full mb-1">Quick Presets</span>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, smtpHost: "smtp.gmail.com", smtpPort: 465, smtpSecure: true })}
                        className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-lg text-xs font-semibold text-gray-600 transition-colors"
                    >
                        Gmail (SSL 465)
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, smtpHost: "smtp.hostinger.com", smtpPort: 465, smtpSecure: true })}
                        className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-lg text-xs font-semibold text-gray-600 transition-colors"
                    >
                        Hostinger (SSL 465)
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                            SMTP Host <Info className="w-3.5 h-3.5 text-gray-300" />
                        </label>
                        <input
                            type="text"
                            value={formData.smtpHost}
                            onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-mono"
                            placeholder="e.g. smtp.gmail.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Port</label>
                        <input
                            type="number"
                            value={formData.smtpPort || ""}
                            onChange={(e) => {
                                const val = e.target.value;
                                const port = val === "" ? 587 : parseInt(val); // ✅ Fixed: default to 587
                                // Auto-toggle secure based on common ports
                                let secure = formData.smtpSecure;
                                if (port === 465) secure = true;
                                if (port === 587) secure = false;
                                setFormData({ ...formData, smtpPort: port, smtpSecure: secure });
                            }}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-mono"
                            placeholder="587"
                        />
                    </div>

                    <div className="flex items-center pt-8">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={formData.smtpSecure}
                                onChange={(e) => setFormData({ ...formData, smtpSecure: e.target.checked })}
                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                            />
                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                Use SSL/TLS (required for 465)
                            </span>
                        </label>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Username</label>
                        <input
                            type="text"
                            value={formData.smtpUser}
                            onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-mono"
                            placeholder="user@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Password</label>
                        <input
                            type="password"
                            value={formData.smtpPass}
                            onChange={(e) => {
                                setFormData({ ...formData, smtpPass: e.target.value });
                                setIsPasswordModified(true); // ✅ Track modification
                            }}
                            // ✅ Removed: onFocus handler that cleared the field
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-mono"
                            placeholder="••••••••"
                        />
                        {formData.smtpPass === "••••••••" && (
                            <p className="text-xs text-gray-400">Password is saved (hidden for security)</p>
                        )}
                    </div>
                </div>

                {/* Test Email Section */}
                <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 space-y-3">
                    <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-indigo-600" />
                        Send Test Email
                    </h4>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            placeholder="recipient@example.com"
                            value={testRecipient}
                            onChange={(e) => setTestRecipient(e.target.value)}
                            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600"
                        />
                        <button
                            onClick={() => testMutation.mutate("send")}
                            disabled={testMutation.isPending || !isValidEmail(testRecipient) || !formData.smtpHost}
                            className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all whitespace-nowrap"
                        >
                            {testMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Send Test"}
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-400 italic">This verifies your configuration by sending a real email through your SMTP server.</p>
                </div>

                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="flex gap-3">
                        <Info className="w-5 h-5 text-amber-600 shrink-0" />
                        <div className="text-xs text-amber-800 leading-relaxed">
                            <p className="font-bold mb-1 underline">Security & Connection Note:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Many VPS providers (AWS, GCP, DigitalOcean) <strong>block port 25, 465, and 587</strong> by default to prevent spam.</li>
                                <li>If you get a <strong>"Connection timeout"</strong>, you may need to open these ports in your server's firewall or contact your hosting provider.</li>
                                <li>For Gmail, ensure you use an <strong>"App Password"</strong> instead of your regular password.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-50">
                    <button
                        onClick={() => testMutation.mutate("verify")}
                        disabled={testMutation.isPending || saveMutation.isPending || !formData.smtpHost}
                        className="w-full sm:w-auto px-6 py-3 text-indigo-600 font-bold text-sm hover:bg-indigo-50 rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                        {testMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Server className="w-4 h-4" />
                        )}
                        Test Connection
                    </button>

                    <button
                        onClick={() => saveMutation.mutate()}
                        disabled={saveMutation.isPending || testMutation.isPending || !formData.smtpHost || (!isPasswordModified && !formData.smtpPass)}
                        className="w-full sm:w-auto bg-indigo-600 text-white text-sm font-bold px-10 py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-100 active:scale-95"
                    >
                        {saveMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {saveMutation.isPending ? "Verifying..." : isConfigured ? "Save Changes" : "Save Configuration"}
                    </button>
                </div>
            </div>
        </div>
    );
}