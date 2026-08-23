"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    ArrowLeft, Plus, Trash2, Loader2, Send, MessageCircle,
    Megaphone, Bell, KeyRound, Check, ChevronDown,
    Bold, Italic, Strikethrough, Code as CodeIcon,
    Link2, Phone, CornerUpLeft, Copy, List, Ban,
    Image as ImageIcon, Video, FileText, MapPin, Type
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

// ─── Constants (mirror Meta's WhatsApp Manager limits) ───────────────────────

const LANGUAGES = [
    { code: "en_US", label: "English (US)" },
    { code: "en_GB", label: "English (UK)" },
    { code: "en", label: "English" },
    { code: "hi", label: "Hindi" },
    { code: "mr", label: "Marathi" },
    { code: "ta", label: "Tamil" },
    { code: "te", label: "Telugu" },
    { code: "bn", label: "Bengali" },
    { code: "gu", label: "Gujarati" },
    { code: "kn", label: "Kannada" },
    { code: "es", label: "Spanish" },
    { code: "pt_BR", label: "Portuguese (BR)" },
    { code: "fr", label: "French" },
    { code: "de", label: "German" },
    { code: "ar", label: "Arabic" },
    { code: "id", label: "Indonesian" },
];

const NAME_MAX = 512;
const HEADER_MAX = 60;
const BODY_MAX = 1024;
const FOOTER_MAX = 60;
const BUTTON_TEXT_MAX = 25;
const COUPON_MAX = 15;
const MAX_BUTTONS = 10;
const MAX_URL_BUTTONS = 2;
const MAX_PHONE_BUTTONS = 1;
const MAX_COPY_BUTTONS = 1;

type Category = "MARKETING" | "UTILITY" | "AUTHENTICATION";
type Step = "SETUP" | "EDIT";
type HeaderFormat = "NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "LOCATION";

// OPT_OUT is UI sugar — submitted to Meta as a QUICK_REPLY button
type ButtonType = "QUICK_REPLY" | "OPT_OUT" | "URL" | "PHONE_NUMBER" | "COPY_CODE";

interface TemplateButton {
    id: number;
    type: ButtonType;
    text: string;
    url?: string;
    phone_number?: string;
    example?: string; // COPY_CODE sample offer code
}

const CATEGORY_CARDS: {
    value: Category;
    icon: typeof Megaphone;
    title: string;
    description: string;
    disabled?: boolean;
}[] = [
    {
        value: "MARKETING",
        icon: Megaphone,
        title: "Marketing",
        description: "Promotions, product announcements, offers and event invites to grow your business.",
    },
    {
        value: "UTILITY",
        icon: Bell,
        title: "Utility",
        description: "Order updates, account alerts, payment reminders about an existing interaction.",
    },
    {
        value: "AUTHENTICATION",
        icon: KeyRound,
        title: "Authentication",
        description: "One-time passcodes to verify a login or transaction.",
        disabled: true,
    },
];

const HEADER_OPTIONS: { value: HeaderFormat; label: string; icon: typeof Type; disabled?: boolean }[] = [
    { value: "NONE", label: "None", icon: Ban },
    { value: "TEXT", label: "Text", icon: Type },
    { value: "IMAGE", label: "Image", icon: ImageIcon, disabled: true },
    { value: "VIDEO", label: "Video", icon: Video, disabled: true },
    { value: "DOCUMENT", label: "Document", icon: FileText, disabled: true },
    { value: "LOCATION", label: "Location", icon: MapPin, disabled: true },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const countVars = (text: string) => {
    const matches = text.match(/\{\{\s*(\d+)\s*\}\}/g) || [];
    return matches.reduce((max, m) => Math.max(max, parseInt(m.replace(/\D/g, ""), 10) || 0), 0);
};

const fillPreview = (text: string, examples: string[]) =>
    text.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n) => {
        const v = examples[parseInt(n, 10) - 1];
        return v || `{{${n}}}`;
    });

const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** WhatsApp text formatting → HTML for the preview bubble. */
const formatWhatsappHtml = (text: string) =>
    escapeHtml(text)
        .replace(/```([^`]+)```/g, "<code style=\"font-family:monospace\">$1</code>")
        .replace(/\*([^*\n]+)\*/g, "<b>$1</b>")
        .replace(/_([^_\n]+)_/g, "<i>$1</i>")
        .replace(/~([^~\n]+)~/g, "<s>$1</s>")
        .replace(/\n/g, "<br/>");

const sanitizeName = (v: string) =>
    v.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, NAME_MAX);

const buttonIcon = (type: ButtonType) => {
    switch (type) {
        case "URL": return <Link2 className="w-3.5 h-3.5" />;
        case "PHONE_NUMBER": return <Phone className="w-3.5 h-3.5" />;
        case "COPY_CODE": return <Copy className="w-3.5 h-3.5" />;
        default: return <CornerUpLeft className="w-3.5 h-3.5" />;
    }
};

const isQuickReply = (t: ButtonType) => t === "QUICK_REPLY" || t === "OPT_OUT";

// ─── Component ────────────────────────────────────────────────────────────────

export function WhatsappTemplateBuilder() {
    const router = useRouter();
    const bodyRef = useRef<HTMLTextAreaElement>(null);
    const nextButtonId = useRef(1);

    const [step, setStep] = useState<Step>("SETUP");
    const [name, setName] = useState("");
    const [category, setCategory] = useState<Category | null>(null);
    const [language, setLanguage] = useState("en_US");

    const [headerFormat, setHeaderFormat] = useState<HeaderFormat>("NONE");
    const [headerText, setHeaderText] = useState("");
    const [headerExample, setHeaderExample] = useState("");
    const [bodyText, setBodyText] = useState("");
    const [bodyExamples, setBodyExamples] = useState<string[]>([]);
    const [footerText, setFooterText] = useState("");
    const [buttons, setButtons] = useState<TemplateButton[]>([]);

    const bodyVarCount = useMemo(() => countVars(bodyText), [bodyText]);
    const headerVarCount = useMemo(() => countVars(headerText), [headerText]);

    const urlCount = buttons.filter(b => b.type === "URL").length;
    const phoneCount = buttons.filter(b => b.type === "PHONE_NUMBER").length;
    const copyCount = buttons.filter(b => b.type === "COPY_CODE").length;
    const optOutCount = buttons.filter(b => b.type === "OPT_OUT").length;

    // ── Editing actions ──

    const addBodyVariable = () => {
        const el = bodyRef.current;
        const token = `{{${bodyVarCount + 1}}}`;
        if (el) {
            const pos = el.selectionStart ?? bodyText.length;
            const next = bodyText.slice(0, pos) + token + bodyText.slice(pos);
            setBodyText(next.slice(0, BODY_MAX));
            requestAnimationFrame(() => {
                el.focus();
                el.setSelectionRange(pos + token.length, pos + token.length);
            });
        } else {
            setBodyText(t => (t + token).slice(0, BODY_MAX));
        }
    };

    const wrapSelection = (marker: string) => {
        const el = bodyRef.current;
        if (!el) return;
        const s = el.selectionStart ?? 0;
        const e = el.selectionEnd ?? 0;
        const selected = bodyText.slice(s, e) || "text";
        const next = bodyText.slice(0, s) + marker + selected + marker + bodyText.slice(e);
        setBodyText(next.slice(0, BODY_MAX));
        requestAnimationFrame(() => {
            el.focus();
            el.setSelectionRange(s + marker.length, s + marker.length + selected.length);
        });
    };

    const addButton = (type: ButtonType) => {
        if (buttons.length >= MAX_BUTTONS) return;
        setButtons(b => [
            ...b,
            {
                id: nextButtonId.current++,
                type,
                text: type === "OPT_OUT" ? "Stop promotions" : type === "COPY_CODE" ? "Copy offer code" : "",
                url: type === "URL" ? "https://" : undefined,
                phone_number: type === "PHONE_NUMBER" ? "" : undefined,
                example: type === "COPY_CODE" ? "" : undefined,
            },
        ]);
    };

    const updateButton = (id: number, patch: Partial<TemplateButton>) =>
        setButtons(b => b.map(btn => (btn.id === id ? { ...btn, ...patch } : btn)));

    const removeButton = (id: number) => setButtons(b => b.filter(btn => btn.id !== id));

    // ── Submission ──

    const createMutation = useMutation({
        mutationFn: async () => {
            // Meta groups same-kind buttons: quick replies together, CTAs together
            const sorted = [...buttons].sort((a, b) => Number(isQuickReply(b.type)) - Number(isQuickReply(a.type)));
            const apiButtons = sorted.map(b => {
                if (isQuickReply(b.type)) return { type: "QUICK_REPLY", text: b.text };
                if (b.type === "COPY_CODE") return { type: "COPY_CODE", example: b.example };
                if (b.type === "URL") return { type: "URL", text: b.text, url: b.url };
                return { type: "PHONE_NUMBER", text: b.text, phone_number: b.phone_number };
            });

            const res = await fetch("/api/whatsapp/templates/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    category,
                    language,
                    headerText: headerFormat === "TEXT" && headerText ? headerText : undefined,
                    headerExample: headerVarCount > 0 ? headerExample : undefined,
                    bodyText,
                    footerText: footerText || undefined,
                    buttons: apiButtons.length > 0 ? apiButtons : undefined,
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

    const canContinue = name.length > 0 && category !== null;

    const canSubmit =
        canContinue &&
        bodyText.length > 0 &&
        (bodyVarCount === 0 || bodyExamples.slice(0, bodyVarCount).every(e => e && e.length > 0)) &&
        (headerFormat !== "TEXT" || headerVarCount === 0 || headerExample.length > 0) &&
        buttons.every(b =>
            b.text.length > 0 &&
            (b.type !== "URL" || !!b.url && b.url.length > 8) &&
            (b.type !== "PHONE_NUMBER" || !!b.phone_number) &&
            (b.type !== "COPY_CODE" || !!b.example)
        );

    // ── Preview data ──

    const previewButtons = buttons;
    const inlinePreview = previewButtons.length <= 3 ? previewButtons : previewButtons.slice(0, 2);
    const overflowCount = previewButtons.length - inlinePreview.length;

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1 — Set up your template (category → name → language), like Meta
    // ─────────────────────────────────────────────────────────────────────────

    if (step === "SETUP") {
        return (
            <div className="max-w-3xl mx-auto pb-16">
                <div className="flex items-center gap-3 mb-8">
                    <button
                        onClick={() => router.push("/dashboard/templates/new")}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Set up your template</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Choose the category that best describes your template, then define its name and language.
                        </p>
                    </div>
                </div>

                {/* Category cards */}
                <div className="space-y-3 mb-8">
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Category</h2>
                    {CATEGORY_CARDS.map(card => {
                        const Icon = card.icon;
                        const selected = category === card.value;
                        return (
                            <button
                                key={card.value}
                                type="button"
                                disabled={card.disabled}
                                onClick={() => setCategory(card.value)}
                                className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                                    card.disabled
                                        ? "border-gray-100 bg-gray-50/50 opacity-60 cursor-not-allowed"
                                        : selected
                                            ? "border-green-600 bg-green-50/40 shadow-sm"
                                            : "border-gray-100 bg-white hover:border-green-200"
                                }`}
                            >
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${selected ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-gray-900">{card.title}</p>
                                        {card.disabled && (
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-400">Coming soon</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">{card.description}</p>
                                </div>
                                {selected && <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />}
                            </button>
                        );
                    })}
                </div>

                {/* Name + language */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5 mb-8">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Name your template</label>
                        <input
                            type="text"
                            placeholder="e.g. seasonal_sale_2026"
                            value={name}
                            onChange={e => setName(sanitizeName(e.target.value))}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-600/10 focus:border-green-600 transition-all"
                        />
                        <p className="text-[11px] text-gray-400">
                            {name.length}/{NAME_MAX} · lowercase letters, numbers and underscores. Not visible to customers.
                        </p>
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
                        <p className="text-[11px] text-gray-400">You can add more languages to the same template later in WhatsApp Manager.</p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={() => setStep("EDIT")}
                        disabled={!canContinue}
                        className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm"
                    >
                        Continue
                    </button>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2 — Edit template (header / body / footer / buttons + live preview)
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="max-w-6xl mx-auto pb-16">
            {/* Header bar */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setStep("SETUP")}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Edit template</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 font-mono normal-case">{name}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500">{category}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500">{LANGUAGES.find(l => l.code === language)?.label || language}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => createMutation.mutate()}
                    disabled={!canSubmit || createMutation.isPending}
                    className="inline-flex items-center gap-2 bg-green-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-all shadow-sm"
                >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {createMutation.isPending ? "Submitting..." : "Submit for review"}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* ─── Form ─── */}
                <div className="lg:col-span-3 space-y-6">

                    {/* Header */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <div>
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Header <span className="text-gray-300 normal-case font-medium">· Optional</span></h2>
                            <p className="text-xs text-gray-400 mt-1">Add a title or select the type of media you&apos;ll use for this header.</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {HEADER_OPTIONS.map(opt => {
                                const Icon = opt.icon;
                                const selected = headerFormat === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        disabled={opt.disabled}
                                        title={opt.disabled ? "Media headers coming soon" : undefined}
                                        onClick={() => setHeaderFormat(opt.value)}
                                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors ${
                                            opt.disabled
                                                ? "border-gray-100 text-gray-300 cursor-not-allowed"
                                                : selected
                                                    ? "border-green-600 bg-green-50 text-green-700"
                                                    : "border-gray-200 text-gray-600 hover:border-green-300"
                                        }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>

                        {headerFormat === "TEXT" && (
                            <>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="e.g. Our summer sale is on! ☀️"
                                        maxLength={HEADER_MAX}
                                        value={headerText}
                                        onChange={e => setHeaderText(e.target.value)}
                                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/10 focus:border-green-600"
                                    />
                                    <button
                                        type="button"
                                        disabled={headerVarCount >= 1}
                                        onClick={() => setHeaderText(t => `${t}${t && !t.endsWith(" ") ? " " : ""}{{1}}`.slice(0, HEADER_MAX))}
                                        className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-40 transition-colors whitespace-nowrap"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Variable
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-400">{headerText.length}/{HEADER_MAX} · headers support one {"{{1}}"} variable</p>
                            </>
                        )}
                    </div>

                    {/* Body */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
                        <div>
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Body</h2>
                            <p className="text-xs text-gray-400 mt-1">Enter the text for your message in the language you&apos;ve selected.</p>
                        </div>
                        <textarea
                            ref={bodyRef}
                            placeholder={"Hi {{1}}! Our biggest sale of the year is live.\n\nGet *25% off* everything until Sunday."}
                            maxLength={BODY_MAX}
                            rows={7}
                            value={bodyText}
                            onChange={e => setBodyText(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/10 focus:border-green-600 resize-y"
                        />
                        {/* Formatting toolbar — mirrors Meta's editor controls */}
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] text-gray-400">{bodyText.length}/{BODY_MAX}</p>
                            <div className="flex items-center gap-1">
                                <button type="button" title="Bold" onClick={() => wrapSelection("*")} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><Bold className="w-4 h-4" /></button>
                                <button type="button" title="Italic" onClick={() => wrapSelection("_")} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><Italic className="w-4 h-4" /></button>
                                <button type="button" title="Strikethrough" onClick={() => wrapSelection("~")} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><Strikethrough className="w-4 h-4" /></button>
                                <button type="button" title="Monospace" onClick={() => wrapSelection("```")} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><CodeIcon className="w-4 h-4" /></button>
                                <div className="w-px h-5 bg-gray-200 mx-1" />
                                <button
                                    type="button"
                                    onClick={addBodyVariable}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add variable
                                </button>
                            </div>
                        </div>
                        <p className="text-[11px] text-gray-400">When a campaign is sent, {"{{1}}"} is filled with each recipient&apos;s first name.</p>
                    </div>

                    {/* Footer */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-3">
                        <div>
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Footer <span className="text-gray-300 normal-case font-medium">· Optional</span></h2>
                            <p className="text-xs text-gray-400 mt-1">Add a short line of text to the bottom of your message.</p>
                        </div>
                        <input
                            type="text"
                            placeholder="e.g. Reply STOP to unsubscribe"
                            maxLength={FOOTER_MAX}
                            value={footerText}
                            onChange={e => setFooterText(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600/10 focus:border-green-600"
                        />
                        <p className="text-[11px] text-gray-400">{footerText.length}/{FOOTER_MAX}</p>
                    </div>

                    {/* Buttons */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Buttons <span className="text-gray-300 normal-case font-medium">· Optional</span></h2>
                                <p className="text-xs text-gray-400 mt-1">Create buttons that let customers respond to your message or take action. Max {MAX_BUTTONS}.</p>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        disabled={buttons.length >= MAX_BUTTONS}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl border border-gray-200 text-gray-700 hover:border-green-300 hover:bg-green-50/40 disabled:opacity-40 transition-colors whitespace-nowrap"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add a button <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64">
                                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Quick reply buttons</div>
                                    <DropdownMenuItem onClick={() => addButton("QUICK_REPLY")}>
                                        <CornerUpLeft className="w-4 h-4 mr-2 text-gray-400" /> Custom
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled={optOutCount >= 1} onClick={() => addButton("OPT_OUT")}>
                                        <Ban className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="flex-1">Marketing opt-out</span>
                                        <span className="text-[10px] text-gray-400">Recommended</span>
                                    </DropdownMenuItem>
                                    <div className="my-1 h-px bg-gray-100" />
                                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Call-to-action buttons</div>
                                    <DropdownMenuItem disabled={urlCount >= MAX_URL_BUTTONS} onClick={() => addButton("URL")}>
                                        <Link2 className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="flex-1">Visit website</span>
                                        <span className="text-[10px] text-gray-400">{urlCount}/{MAX_URL_BUTTONS}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled={phoneCount >= MAX_PHONE_BUTTONS} onClick={() => addButton("PHONE_NUMBER")}>
                                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="flex-1">Call phone number</span>
                                        <span className="text-[10px] text-gray-400">{phoneCount}/{MAX_PHONE_BUTTONS}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem disabled={copyCount >= MAX_COPY_BUTTONS} onClick={() => addButton("COPY_CODE")}>
                                        <Copy className="w-4 h-4 mr-2 text-gray-400" />
                                        <span className="flex-1">Copy offer code</span>
                                        <span className="text-[10px] text-gray-400">{copyCount}/{MAX_COPY_BUTTONS}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {buttons.length > 0 && (
                            <div className="space-y-2.5">
                                {buttons.map(btn => (
                                    <div key={btn.id} className="flex items-center gap-2 bg-gray-50/60 border border-gray-100 rounded-xl p-2.5">
                                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase text-gray-400 w-24 flex-shrink-0 pl-1">
                                            {buttonIcon(btn.type)}
                                            {btn.type === "OPT_OUT" ? "Opt-out"
                                                : btn.type === "QUICK_REPLY" ? "Reply"
                                                : btn.type === "URL" ? "Website"
                                                : btn.type === "PHONE_NUMBER" ? "Call"
                                                : "Copy code"}
                                        </span>
                                        <input
                                            type="text"
                                            placeholder={`Button text (max ${BUTTON_TEXT_MAX})`}
                                            maxLength={BUTTON_TEXT_MAX}
                                            disabled={btn.type === "COPY_CODE"}
                                            value={btn.text}
                                            onChange={e => updateButton(btn.id, { text: e.target.value })}
                                            className="flex-1 min-w-0 border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-600 disabled:bg-gray-100 disabled:text-gray-500"
                                        />
                                        {btn.type === "URL" && (
                                            <>
                                                <select disabled className="border border-gray-200 bg-gray-100 rounded-lg px-2 py-2 text-xs text-gray-500">
                                                    <option>Static</option>
                                                </select>
                                                <input
                                                    type="url"
                                                    placeholder="https://www.example.com"
                                                    value={btn.url || ""}
                                                    onChange={e => updateButton(btn.id, { url: e.target.value })}
                                                    className="flex-1 min-w-0 border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                                                />
                                            </>
                                        )}
                                        {btn.type === "PHONE_NUMBER" && (
                                            <input
                                                type="tel"
                                                placeholder="+91 98765 43210"
                                                value={btn.phone_number || ""}
                                                onChange={e => updateButton(btn.id, { phone_number: e.target.value })}
                                                className="flex-1 min-w-0 border border-gray-200 bg-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-600"
                                            />
                                        )}
                                        {btn.type === "COPY_CODE" && (
                                            <input
                                                type="text"
                                                placeholder="Sample code, e.g. SAVE25"
                                                maxLength={COUPON_MAX}
                                                value={btn.example || ""}
                                                onChange={e => updateButton(btn.id, { example: e.target.value.toUpperCase() })}
                                                className="flex-1 min-w-0 border border-amber-200 bg-amber-50/40 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-400"
                                            />
                                        )}
                                        <button type="button" onClick={() => removeButton(btn.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <p className="text-[11px] text-gray-400">
                                    If you add more than 3 buttons, they appear in a list. Buttons of the same type are grouped when delivered.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Sample values */}
                    {(bodyVarCount > 0 || (headerFormat === "TEXT" && headerVarCount > 0)) && (
                        <div className="bg-white rounded-2xl border border-amber-100 p-6 space-y-4">
                            <div>
                                <h2 className="text-sm font-bold text-amber-700 uppercase tracking-wider">Sample content</h2>
                                <p className="text-xs text-gray-400 mt-1">
                                    Meta requires an example for every variable so reviewers understand your message. Samples are never sent to customers.
                                </p>
                            </div>
                            {headerFormat === "TEXT" && headerVarCount > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-gray-400 w-20 flex-shrink-0">Header {"{{1}}"}</span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Summer Sale"
                                        value={headerExample}
                                        onChange={e => setHeaderExample(e.target.value)}
                                        className="flex-1 border border-amber-200 bg-amber-50/40 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400"
                                    />
                                </div>
                            )}
                            {Array.from({ length: bodyVarCount }, (_, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-gray-400 w-20 flex-shrink-0">Body {`{{${i + 1}}}`}</span>
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

                {/* ─── Live Preview ─── */}
                <div className="lg:col-span-2">
                    <div className="sticky top-6">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Preview</p>
                        <div className="bg-[#e5ddd5] rounded-3xl p-4 sm:p-6 shadow-inner min-h-[420px]"
                            style={{ backgroundImage: "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.25) 0, transparent 50%)" }}>
                            <div className="max-w-[300px]">
                                <div className="bg-white rounded-lg rounded-tl-none shadow-sm p-3 space-y-1.5">
                                    {headerFormat === "TEXT" && headerText && (
                                        <p className="text-sm font-bold text-gray-900 whitespace-pre-wrap break-words">
                                            {fillPreview(headerText, [headerExample])}
                                        </p>
                                    )}
                                    {bodyText ? (
                                        <p
                                            className="text-sm text-gray-800 break-words"
                                            dangerouslySetInnerHTML={{ __html: formatWhatsappHtml(fillPreview(bodyText, bodyExamples)) }}
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-300">Your message appears here…</p>
                                    )}
                                    {footerText && (
                                        <p className="text-xs text-gray-400 whitespace-pre-wrap break-words">{footerText}</p>
                                    )}
                                    <p className="text-[10px] text-gray-400 text-right">
                                        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                    {/* Buttons attach inside the bubble, separated by hairlines (like WhatsApp) */}
                                    {previewButtons.length > 0 && (
                                        <div className="-mx-3 -mb-3 mt-2">
                                            {inlinePreview.map(b => (
                                                <div key={b.id} className="border-t border-gray-100 py-2.5 text-center text-sm font-semibold text-[#00a5f4] flex items-center justify-center gap-1.5">
                                                    {buttonIcon(b.type)}
                                                    {b.type === "COPY_CODE"
                                                        ? "Copy offer code"
                                                        : b.text || <span className="text-gray-300">Button</span>}
                                                </div>
                                            ))}
                                            {overflowCount > 0 && (
                                                <div className="border-t border-gray-100 py-2.5 text-center text-sm font-semibold text-[#00a5f4] flex items-center justify-center gap-1.5">
                                                    <List className="w-3.5 h-3.5" /> See all options
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
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
