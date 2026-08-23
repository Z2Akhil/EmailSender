"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    Rocket, Users, PenLine, ArrowRight, Loader2, CheckCircle2,
    Upload, Sparkles, Mail
} from "lucide-react";
import Link from "next/link";
import { Template, ApiResponse } from "@/types";

interface Props {
    workspaceName: string;
    userEmail: string;
    isProfileComplete: boolean;
}

type Step = 1 | 2 | 3;

/** Parses "a@b.com, Jane Doe <jane@x.com>" style pasted lists. */
function parseEmails(raw: string): { email: string; fullName?: string }[] {
    return raw
        .split(/[\n,;]+/)
        .map(s => s.trim())
        .filter(Boolean)
        .map(entry => {
            const named = entry.match(/^(.+?)\s*<([^>]+)>$/);
            if (named) {
                return { email: named[2].trim(), fullName: named[1].trim() };
            }
            return { email: entry };
        });
}

export function OnboardingWizard({ workspaceName, userEmail, isProfileComplete }: Props) {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [brandName, setBrandName] = useState(workspaceName);
    const [pasted, setPasted] = useState("");
    const [listId, setListId] = useState<string | null>(null);
    const [importSummary, setImportSummary] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const { data: templatesData } = useQuery<ApiResponse<Template[]>>({
        queryKey: ["templates"],
        queryFn: async () => {
            const res = await fetch("/api/templates");
            if (!res.ok) throw new Error("Failed to fetch templates");
            return res.json();
        },
        enabled: step === 3,
    });

    const galleryPicks = (templatesData?.data || [])
        .filter(t => t.isGlobal && ["welcome", "launch", "newsletter"].includes(t.category || ""))
        .slice(0, 3);

    const markOnboarding = async (action: "complete" | "skip") => {
        await fetch("/api/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action }),
        });
    };

    const skip = async () => {
        setBusy(true);
        await markOnboarding("skip");
        router.push("/dashboard");
        router.refresh();
    };

    // Step 1: save brand name (+ silently complete profile for Google users
    // so the profile dialog doesn't double-onboard them later)
    const saveBrand = async () => {
        if (!brandName.trim()) return;
        setBusy(true);
        try {
            await fetch("/api/settings/workspace", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: brandName.trim() }),
            });
            if (!isProfileComplete) {
                await fetch("/api/users/profile", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: brandName.trim() }),
                });
            }
            setStep(2);
        } catch {
            toast.error("Could not save — try again");
        } finally {
            setBusy(false);
        }
    };

    // Step 2: create a list (once) and bulk-add pasted contacts
    const importContacts = async () => {
        const contacts = parseEmails(pasted);
        if (contacts.length === 0) {
            toast.error("Paste at least one email address");
            return;
        }
        setBusy(true);
        try {
            let id = listId;
            if (!id) {
                const listRes = await fetch("/api/contacts/lists", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: "My First List" }),
                });
                const listJson = await listRes.json();
                if (!listRes.ok) throw new Error(listJson.error || "Failed to create list");
                id = listJson.data.id || listJson.data._id;
                setListId(id);
            }

            const res = await fetch(`/api/contacts/lists/${id}/bulk`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contacts: contacts.slice(0, 500) }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Import failed");

            const { inserted, duplicates, invalid, limited } = json.data;
            let msg = `Added ${inserted} contact${inserted === 1 ? "" : "s"}`;
            if (duplicates) msg += `, ${duplicates} already existed`;
            if (invalid) msg += `, ${invalid} invalid`;
            if (limited) msg += ` — ${limited} skipped (plan limit reached)`;
            setImportSummary(msg);
            toast.success(msg);
            setStep(3);
        } catch (err: any) {
            toast.error(err.message || "Import failed");
        } finally {
            setBusy(false);
        }
    };

    const launchWith = async (templateId?: string) => {
        setBusy(true);
        await markOnboarding("complete");
        router.push(templateId
            ? `/dashboard/campaigns/new?templateId=${templateId}`
            : "/dashboard/campaigns/new");
    };

    const finish = async () => {
        setBusy(true);
        await markOnboarding("complete");
        router.push("/dashboard");
        router.refresh();
    };

    return (
        <div className="max-w-2xl mx-auto py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-2">
                    {[1, 2, 3].map(n => (
                        <div key={n} className={`h-1.5 rounded-full transition-all ${n <= step ? "w-10 bg-blue-600" : "w-6 bg-gray-200"}`} />
                    ))}
                </div>
                <button
                    onClick={skip}
                    disabled={busy}
                    className="text-sm text-gray-400 hover:text-gray-600 font-medium"
                >
                    Skip setup →
                </button>
            </div>

            {step === 1 && (
                <div className="bg-white rounded-3xl border border-gray-100 p-10 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Rocket className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome! Let&apos;s set you up</h1>
                    <p className="text-gray-500 mb-8">
                        Two quick steps and you&apos;ll be ready to send your first campaign.
                        <br />First — what&apos;s your brand called?
                    </p>
                    <input
                        type="text"
                        placeholder="Your brand or company name"
                        value={brandName}
                        onChange={e => setBrandName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && saveBrand()}
                        className="w-full max-w-sm mx-auto block border border-gray-200 rounded-xl px-4 py-3 text-center text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 mb-2"
                    />
                    <p className="text-xs text-gray-400 mb-8">Recipients see this as the sender name.</p>
                    <button
                        onClick={saveBrand}
                        disabled={!brandName.trim() || busy}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                    >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                        Continue
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="bg-white rounded-3xl border border-gray-100 p-10">
                    <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Users className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Add your first contacts</h1>
                    <p className="text-gray-500 mb-6 text-center">
                        Paste email addresses below — one per line or comma-separated.
                        <br /><span className="text-xs">&ldquo;Jane &lt;jane@acme.com&gt;&rdquo; works too and keeps the name.</span>
                    </p>
                    <textarea
                        rows={6}
                        placeholder={"jane@acme.com\nJohn Smith <john@acme.com>\nteam@startup.io"}
                        value={pasted}
                        onChange={e => setPasted(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 mb-2"
                    />
                    <p className="text-xs text-gray-400 mb-6">
                        {parseEmails(pasted).length} address{parseEmails(pasted).length === 1 ? "" : "es"} detected
                    </p>
                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={importContacts}
                            disabled={busy || parseEmails(pasted).length === 0}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white font-semibold px-8 py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                        >
                            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                            Add Contacts
                        </button>
                        <button onClick={() => setStep(3)} className="text-sm text-gray-400 hover:text-gray-600 font-medium">
                            Skip this
                        </button>
                    </div>
                    <p className="text-center mt-6 text-xs text-gray-400">
                        Have a spreadsheet?{" "}
                        <Link href="/dashboard/contacts/upload" className="text-blue-600 underline inline-flex items-center gap-1">
                            <Upload className="w-3 h-3" /> Import a CSV instead
                        </Link>
                    </p>
                </div>
            )}

            {step === 3 && (
                <div className="bg-white rounded-3xl border border-gray-100 p-10">
                    <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Pick a starting point</h1>
                    <p className="text-gray-500 mb-2 text-center">
                        Choose a template and we&apos;ll drop you straight into your first campaign.
                    </p>
                    {importSummary && (
                        <p className="text-xs text-green-600 mb-6 text-center flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {importSummary}
                        </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 mb-8">
                        {galleryPicks.map(t => (
                            <button
                                key={t.id}
                                onClick={() => launchWith(t.id)}
                                disabled={busy}
                                className="group text-left p-5 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:shadow-md transition-all"
                            >
                                <Mail className="w-6 h-6 text-blue-500 mb-3" />
                                <p className="font-bold text-gray-900 group-hover:text-blue-700">{t.name}</p>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.description}</p>
                            </button>
                        ))}
                        <button
                            onClick={() => launchWith()}
                            disabled={busy}
                            className="group text-left p-5 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 transition-all"
                        >
                            <PenLine className="w-6 h-6 text-gray-400 mb-3 group-hover:text-blue-500" />
                            <p className="font-bold text-gray-700">Start blank</p>
                            <p className="text-xs text-gray-500 mt-1">Write your email from scratch</p>
                        </button>
                    </div>

                    <div className="text-center">
                        <button onClick={finish} disabled={busy} className="text-sm text-gray-400 hover:text-gray-600 font-medium">
                            I&apos;ll do this later — take me to the dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
