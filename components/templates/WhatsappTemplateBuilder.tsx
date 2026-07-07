"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    ArrowLeft, Plus, Trash2, Loader2, Send,
    MessageCircle, Link2, Phone, CornerUpLeft
} from "lucide-react";

const LANGUAGES = [
    { code: "en_US", label: "English (US)" },
    { code: "en", label: "English" },
    { code: "hi", label: "Hindi" },
    { code: "es", label: "Spanish" },
    { code: "pt_BR", label: "Portuguese (BR)" },
    { code: "fr", label: "French" },
    { code: "de", label: "German" },
    { code: "ar", label: "Arabic" },
    { code: "id", label: "Indonesian" },
];

type ButtonType = "QUICK_REPLY" | "URL" | "PHONE_NUMBER";
interface TemplateButton {
    type: ButtonType;
    text: string;
    url?: string;
    phone_number?: string;
}

const countVars = (text: string) => {
    const matches = text.match(/\{\{\s*(\d+)\s*\}\}/g) || [];
    return matches.reduce((max, m) => Math.max(max, parseInt(m.replace(/\D/g, ""), 10) || 0), 0);
};

/** Replaces {{n}} with example values (or a highlighted placeholder) for the preview. */
const fillPreview = (text: string, examples: string[]) =>
    text.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n) => {
        const v = examples[parseInt(n, 10) - 1];
        return v || `{{${n}}}`;
    });

export function WhatsappTemplateBuilder() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [category, setCategory] = useState<"MARKETING" | "UTILITY">("MARKETING");
    const [language, setLanguage] = useState("en_US");
    const [headerEnabled, setHeaderEnabled] = useState(false);
    const [headerText, setHeaderText] = useState("");
    const [bodyText, setBodyText] = useState("");
    const [footerText, setFooterText] = useState("");
    const [buttons, setButtons] = useState<TemplateButton[]>([]);
    const [bodyExamples, setBodyExamples] = useState<string[]>([]);
    const [headerExample, setHeaderExample] = useState("");

    const bodyVarCount = useMemo(() => countVars(bodyText), [bodyText]);
    const headerVarCount = useMemo(() => countVars(headerText), [headerText]);

    const sanitizeName = (v: string) =>
        v.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");

    const addVariable = () => {
        const next = bodyVarCount + 1;
        setBodyText(t => `${t}${t.endsWith(" ") || t === "" ? "" : " "}{{${next}}}`);
    };

    const addButton = (type: ButtonType) => {
        if (buttons.length >= 3) return;
        setButtons(b => [...b, { type, text: "", url: type === "URL" ? "https://" : undefined, phone_number: type === "PHONE_NUMBER" ? "" : undefined }]);
    };

    const updateButton = (i: number, patch: Partial<TemplateButton>) =>
        setButtons(b => b.map((btn, idx) => (idx === i ? { ...btn, ...patch } : btn)));

    const removeButton = (i: number) => setButtons(b => b.filter((_, idx) => idx !== i));

    const createMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/whatsapp/templates/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    category,
                    language,
                    headerText: headerEnabled && headerText ? headerText : undefined,
                    headerExample: headerVarCount > 0 ? headerExample : undefined,
                    bodyText,
                    footerText: footerText || undefined,
                    buttons: buttons.length > 0 ? buttons : undefined,
                    bodyExamples: bodyVarCount > 0 ? bodyExamples.slice(0, bodyVarCount) : undefined,
                }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to create template");
            return json;
        },
        onSuccess: (data) => {
            toast.success(data.message, { duration: 8000 });
            router.push("/dashboard/templates");
        },
        onError: (err: any) => toast.error(err.message, { duration: 8000 }),
    });

    const canSubmit =
        name.length > 0 &&
        bodyText.length > 0 &&
        (bodyVarCount === 0 || bodyExamples.slice(0, bodyVarCount).every(e => e && e.length > 0)) &&
        (headerVarCount === 0 || headerExample.length > 0) &&
        buttons.every(b => b.text.length > 0 && (b.type !== "URL" || !!b.url) && (b.type !== "PHONE_NUMBER" || !!b.phone_number));

    return (
        <div className="max-w-6xl mx-auto pb-16">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/dashboard/templates/new")}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">New WhatsApp Template</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Submitted to Meta for review — approved templates appear after a sync
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => createMutation.mutate()}
                    disabled={!canSubmit || createMutation.isPending}
                    className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm"
                >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {createMutation.isPending ? "Submitting..." : "Submit for Review"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* ─── Form ─── */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Basics */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Template Settings</h2>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Template Name</label>
                            <input
                                type="text"
                                placeholder="e.g. order_update"
                                value={name}
                                onChange={e => setName(sanitizeName(e.target.value))}
                                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-600/10 focus:border-green-600 transition-all"
                            />
                            <p className="text-[11px] text-gray-400">Lowercase letters, numbers and underscores. Not visible to recipients.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Category</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value as any)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/10 focus:border-green-600"
                                >
                                    <option value="MARKETING">Marketing — promos, offers, news</option>
                                    <option value="UTILITY">Utility — order/account updates</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700">Language</label>
                                <select
                                    value={language}
                                    onChange={e => setLanguage(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/10 focus:border-green-600"
                                >
                                    {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Header <span className="text-gray-300 normal-case font-medium">(optional)</span></h2>
                            <button
                                type="button"
                                onClick={() => setHeaderEnabled(v => !v)}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${headerEnabled ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                            >
                                {headerEnabled ? "Enabled" : "Add header"}
                            </button>
                        </div>
                        {headerEnabled && (
                            <>
                                <input
                                    type="text"
                                    placeholder="e.g. Order update 📦"
                                    maxLength={60}
                                    value={headerText}
                                    onChange={e => setHeaderText(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/10 focus:border-green-600"
                                />
                                <p className="text-[11px] text-gray-400">{headerText.length}/60 · may contain one {"{{1}}"} variable</p>
                                {headerVarCount > 0 && (
                                    <input
                                        type="text"
                                        placeholder="Example value for header {{1}} (required by Meta)"
                                        value={headerExample}
                                        onChange={e => setHeaderExample(e.target.value)}
                                        className="w-full border border-amber-200 bg-amber-50/40 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400"
                                    />
                                )}
                            </>
                        )}
                    </div>

                    {/* Body */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Body</h2>
                            <button
                                type="button"
                                onClick={addVariable}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add variable
                            </button>
                        </div>
                        <textarea
                            placeholder={"Hi {{1}}, your order has shipped!\n\nUse *bold*, _italic_ and ~strikethrough~ like in WhatsApp."}
                            maxLength={1024}
                            rows={6}
                            value={bodyText}
                            onChange={e => setBodyText(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/10 focus:border-green-600 resize-y"
                        />
                        <p className="text-[11px] text-gray-400">{bodyText.length}/1024 · when sending, {"{{1}}"} is filled with the recipient&apos;s first name</p>

                        {bodyVarCount > 0 && (
                            <div className="space-y-2 pt-1">
                                <p className="text-xs font-semibold text-amber-700">Example values (required by Meta for review)</p>
                                {Array.from({ length: bodyVarCount }, (_, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-gray-400 w-12">{`{{${i + 1}}}`}</span>
                                        <input
                                            type="text"
                                            placeholder={i === 0 ? "e.g. John" : "example value"}
                                            value={bodyExamples[i] || ""}
                                            onChange={e => {
                                                const next = [...bodyExamples];
                                                next[i] = e.target.value;
                                                setBodyExamples(next);
                                            }}
                                            className="flex-1 border border-amber-200 bg-amber-50/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
                        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Footer <span className="text-gray-300 normal-case font-medium">(optional)</span></h2>
                        <input
                            type="text"
                            placeholder="e.g. Reply STOP to unsubscribe"
                            maxLength={60}
                            value={footerText}
                            onChange={e => setFooterText(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/10 focus:border-green-600"
                        />
                        <p className="text-[11px] text-gray-400">{footerText.length}/60 · small grey text under the message</p>
                    </div>

                    {/* Buttons */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Buttons <span className="text-gray-300 normal-case font-medium">(optional, max 3)</span></h2>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => addButton("QUICK_REPLY")} disabled={buttons.length >= 3}
                                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 transition-colors">
                                    <CornerUpLeft className="w-3 h-3" /> Reply
                                </button>
                                <button type="button" onClick={() => addButton("URL")} disabled={buttons.length >= 3}
                                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 transition-colors">
                                    <Link2 className="w-3 h-3" /> URL
                                </button>
                                <button type="button" onClick={() => addButton("PHONE_NUMBER")} disabled={buttons.length >= 3}
                                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 transition-colors">
                                    <Phone className="w-3 h-3" /> Call
                                </button>
                            </div>
                        </div>

                        {buttons.map((btn, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase text-gray-400 w-14">{btn.type === "QUICK_REPLY" ? "Reply" : btn.type === "URL" ? "URL" : "Call"}</span>
                                <input
                                    type="text"
                                    placeholder="Button text (max 25)"
                                    maxLength={25}
                                    value={btn.text}
                                    onChange={e => updateButton(i, { text: e.target.value })}
                                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                                />
                                {btn.type === "URL" && (
                                    <input
                                        type="url"
                                        placeholder="https://…"
                                        value={btn.url || ""}
                                        onChange={e => updateButton(i, { url: e.target.value })}
                                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                                    />
                                )}
                                {btn.type === "PHONE_NUMBER" && (
                                    <input
                                        type="tel"
                                        placeholder="+91 98765 43210"
                                        value={btn.phone_number || ""}
                                        onChange={e => updateButton(i, { phone_number: e.target.value })}
                                        className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                                    />
                                )}
                                <button type="button" onClick={() => removeButton(i)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── Live Preview ─── */}
                <div className="lg:col-span-2">
                    <div className="sticky top-6">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Preview</p>
                        <div className="bg-[#e5ddd5] rounded-3xl p-4 sm:p-6 shadow-inner min-h-[420px]"
                            style={{ backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.25) 0, transparent 50%)" }}>
                            <div className="max-w-[300px]">
                                <div className="bg-white rounded-lg rounded-tl-none shadow-sm p-3 space-y-1.5">
                                    {headerEnabled && headerText && (
                                        <p className="text-sm font-bold text-gray-900 whitespace-pre-wrap break-words">
                                            {fillPreview(headerText, [headerExample])}
                                        </p>
                                    )}
                                    <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                                        {bodyText
                                            ? fillPreview(bodyText, bodyExamples)
                                            : <span className="text-gray-300">Your message appears here…</span>}
                                    </p>
                                    {footerText && (
                                        <p className="text-xs text-gray-400 whitespace-pre-wrap break-words">{footerText}</p>
                                    )}
                                    <p className="text-[10px] text-gray-400 text-right">
                                        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                </div>
                                {buttons.length > 0 && (
                                    <div className="mt-1 space-y-1">
                                        {buttons.map((b, i) => (
                                            <div key={i} className="bg-white rounded-lg shadow-sm py-2 text-center text-sm font-semibold text-[#00a5f4] flex items-center justify-center gap-1.5">
                                                {b.type === "URL" && <Link2 className="w-3.5 h-3.5" />}
                                                {b.type === "PHONE_NUMBER" && <Phone className="w-3.5 h-3.5" />}
                                                {b.type === "QUICK_REPLY" && <CornerUpLeft className="w-3.5 h-3.5" />}
                                                {b.text || <span className="text-gray-300">Button</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 p-4 bg-green-50/60 border border-green-100 rounded-2xl flex items-start gap-3">
                            <MessageCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-green-800 leading-relaxed">
                                Meta reviews every template before it can be sent — usually minutes,
                                up to 24 hours. After approval, hit <b>Sync WhatsApp</b> on the Templates
                                page to pull it in.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
