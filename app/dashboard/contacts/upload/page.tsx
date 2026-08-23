"use client";

import { useState, useRef, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
    Upload, FileText, X, CheckCircle, AlertCircle, ChevronRight, Loader2,
    ArrowLeft, Layers, Download, Mail, MessageCircle,
} from "lucide-react";
import { ApiResponse, ContactList } from "@/types";
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";
import {
    CONTACT_IMPORT_FIELDS,
    SAMPLE_CSV,
    TEMPLATE_GRID,
    autoMapColumns,
    contactKey,
    isEmailReady,
    isWhatsappReady,
    normalizeRow,
    type ColumnMapping,
} from "@/lib/contact-import";

interface ImportResult {
    total: number;
    imported: number;
    updated: number;
    skipped: number;
    duplicatesInFile: number;
    errors: number;
    errorDetails: { row: number; identifier: string; reason: string }[];
    emailReady: number;
    whatsappReady: number;
    limitReached: boolean;
}

type Row = Record<string, string>;

/** Rows beyond this are still uploaded — only the local preview stats are capped. */
const PREVIEW_ROW_CAP = 20000;

const GROUP_STYLES: Record<string, { label: string; className: string }> = {
    identity: { label: "Details", className: "bg-gray-100 text-gray-600" },
    email: { label: "Email", className: "bg-blue-50 text-blue-700" },
    whatsapp: { label: "WhatsApp", className: "bg-green-50 text-green-700" },
};

function useCountryOptions() {
    return useMemo(() => {
        const names = new Intl.DisplayNames(["en"], { type: "region" });
        return getCountries()
            .map((code) => ({
                code,
                label: `${names.of(code) || code} (+${getCountryCallingCode(code)})`,
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, []);
}

function UploadPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const listIdFromUrl = searchParams.get("listId");
    const countryOptions = useCountryOptions();

    const [step, setStep] = useState<"upload" | "map" | "result">("upload");
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [rows, setRows] = useState<Row[]>([]);
    const [mapping, setMapping] = useState<ColumnMapping>({});
    const [defaultCountry, setDefaultCountry] = useState<CountryCode | "">("");
    const [whatsappOptInDefault, setWhatsappOptInDefault] = useState(true);
    const [updateExisting, setUpdateExisting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [parseError, setParseError] = useState("");
    const [selectedListId, setSelectedListId] = useState(listIdFromUrl || "");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: listsData, isLoading: isLoadingLists } = useQuery<ApiResponse<ContactList[]>>({
        queryKey: ["contact-lists"],
        queryFn: async () => {
            const res = await fetch("/api/contacts/lists");
            if (!res.ok) throw new Error("Failed to fetch lists");
            return res.json();
        },
    });

    const lists = listsData?.data || [];
    const activeListId = listIdFromUrl || selectedListId;
    const activeList = lists.find((l) => l.id === activeListId);

    // ─── Live validation: run the exact server normalizer over the parsed file ──
    const stats = useMemo(() => {
        const empty = { emailReady: 0, whatsappReady: 0, both: 0, invalid: 0, duplicates: 0, usable: 0 };
        if (!rows.length || (!mapping.email && !mapping.whatsappNumber)) return empty;

        const seen = new Set<string>();
        const result = { ...empty };

        for (const row of rows) {
            const { contact } = normalizeRow(row, mapping, {
                defaultCountry: defaultCountry || undefined,
                whatsappOptInDefault,
            });
            if (!contact) {
                result.invalid++;
                continue;
            }
            const key = contactKey(contact);
            if (seen.has(key)) {
                result.duplicates++;
                continue;
            }
            seen.add(key);
            result.usable++;
            const email = isEmailReady(contact);
            const whatsapp = isWhatsappReady(contact);
            if (email) result.emailReady++;
            if (whatsapp) result.whatsappReady++;
            if (email && whatsapp) result.both++;
        }
        return result;
    }, [rows, mapping, defaultCountry, whatsappOptInDefault]);

    const previewRows = useMemo(() => rows.slice(0, 5), [rows]);
    const canImport = !!activeListId && (!!mapping.email || !!mapping.whatsappNumber) && stats.usable > 0;

    const renderFieldRow = (field: (typeof CONTACT_IMPORT_FIELDS)[number]) => {
        const group = GROUP_STYLES[field.group];
        return (
            <div key={field.key} className="flex items-start gap-4">
                <div className="w-44 shrink-0 pt-2.5">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">{field.label}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${group.className}`}>
                            {group.label}
                        </span>
                    </div>
                    {field.hint && <p className="text-xs text-gray-400 mt-0.5">{field.hint}</p>}
                </div>
                <select
                    value={mapping[field.key] || ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [field.key]: e.target.value || undefined }))}
                    className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all bg-white"
                >
                    <option value="">(skip)</option>
                    {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                    ))}
                </select>
            </div>
        );
    };

    const parseFile = async (f: File) => {
        setParseError("");
        const name = f.name.toLowerCase();
        const supported = [".csv", ".tsv", ".xlsx", ".xls", ".ods"];

        if (!supported.some((ext) => name.endsWith(ext))) {
            setParseError("Unsupported file type. Please upload a .csv, .xlsx, .xls, .ods or .tsv file.");
            return;
        }

        try {
            // SheetJS reads every supported format (auto-detects CSV/TSV from
            // content). `raw: false` keeps long phone numbers out of float land.
            const XLSX = await import("xlsx");
            const buffer = await f.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array", raw: false });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const grid = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "", raw: false });

            const headerRow = (grid[0] || []).map((h) => String(h ?? "").trim());
            const cols = headerRow.filter(Boolean);
            if (cols.length === 0) {
                setParseError("File is empty or has no header row");
                return;
            }

            const parsedRows = grid.slice(1, PREVIEW_ROW_CAP + 1)
                .map((row) => Object.fromEntries(headerRow.map((col, i) => [col, String(row[i] ?? "")])) as Row)
                .filter((row) => Object.values(row).some((v) => v.trim()));

            setHeaders(cols);
            setRows(parsedRows);
            setMapping(autoMapColumns(cols));
        } catch {
            setParseError("Could not read this file — is it a valid spreadsheet?");
            return;
        }

        setFile(f);
        setStep("map");
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) parseFile(f);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) parseFile(f);
    };

    const saveBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.style.display = "none";
        // Firefox ignores .click() on a detached anchor, and revoking the URL
        // synchronously can cancel the download — append, click, clean up after.
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 1000);
    };

    const downloadTemplate = async (format: "xlsx" | "csv") => {
        if (format === "csv") {
            // ﻿ = UTF-8 BOM, without it Excel mis-decodes non-ASCII names.
            saveBlob(new Blob([`﻿${SAMPLE_CSV}`], { type: "text/csv;charset=utf-8" }), "contacts-template.csv");
            return;
        }

        const XLSX = await import("xlsx");
        const sheet = XLSX.utils.aoa_to_sheet(TEMPLATE_GRID);
        // Force every cell to text so Excel keeps "919876543210" intact instead
        // of rounding it into 9.19E+11 — which the importer then rejects.
        for (const ref of Object.keys(sheet)) {
            if (ref.startsWith("!")) continue;
            const cell = sheet[ref] as { t: string; z?: string };
            cell.t = "s";
            cell.z = "@";
        }
        sheet["!cols"] = TEMPLATE_GRID[0].map((h) => ({ wch: Math.max(14, h.length + 2) }));

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, sheet, "Contacts");
        const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        saveBlob(
            new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
            "contacts-template.xlsx"
        );
    };

    const handleImport = async () => {
        if (!file || !canImport) return;
        setIsImporting(true);
        setParseError("");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("mapping", JSON.stringify(mapping));
        if (defaultCountry) formData.append("defaultCountry", defaultCountry);
        formData.append("whatsappOptIn", String(whatsappOptInDefault));
        formData.append("updateExisting", String(updateExisting));

        try {
            const res = await fetch(`/api/contacts/lists/${activeListId}/import`, {
                method: "POST",
                body: formData,
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.error || "Import failed");
            setImportResult(json.data);
            setStep("result");
        } catch (err: unknown) {
            setParseError((err as Error).message);
        } finally {
            setIsImporting(false);
        }
    };

    const reset = () => {
        setStep("upload");
        setFile(null);
        setHeaders([]);
        setRows([]);
        setMapping({});
        setImportResult(null);
        setParseError("");
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <button
                    onClick={() => activeListId ? router.push(`/dashboard/contacts/${activeListId}`) : router.push("/dashboard/contacts")}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Import Contacts</h1>
                    <p className="text-gray-500 mt-0.5 text-sm">One file for both email and WhatsApp campaigns</p>
                </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
                {["Upload", "Map Columns", "Import"].map((label, i) => {
                    const currentIdx = ["upload", "map", "result"].indexOf(step);
                    const isActive = i === currentIdx;
                    const isDone = i < currentIdx;
                    return (
                        <div key={label} className="flex items-center gap-2">
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${isActive ? "bg-blue-600 text-white" :
                                isDone ? "bg-green-100 text-green-700" :
                                    "bg-gray-100 text-gray-400"
                                }`}>
                                {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="w-4 h-4 flex items-center justify-center text-xs">{i + 1}</span>}
                                {label}
                            </div>
                            {i < 2 && <ChevronRight className="w-4 h-4 text-gray-300" />}
                        </div>
                    );
                })}
            </div>

            {/* Step: Upload */}
            {step === "upload" && (
                <div className="space-y-4">
                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`bg-white border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                            }`}
                    >
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                            <Upload className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Drop your file here</h2>
                        <p className="text-gray-500 text-sm mb-4">or click to browse</p>
                        <p className="text-xs text-gray-400">Supports .csv, .xlsx, .xls, .ods and .tsv files</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.tsv,.xlsx,.xls,.ods"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {parseError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {parseError}
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-1">Not sure about the format?</h3>
                        <p className="text-sm text-gray-500">
                            Four columns: <strong>name</strong>, <strong>email</strong>, <strong>phone</strong>,{" "}
                            <strong>whatsapp</strong>. Fill in the email to reach someone by email, the WhatsApp
                            number to reach them on WhatsApp, or both — a row with only one still imports and is used
                            by that channel&apos;s campaigns. Any other column layout works too; you map it on the
                            next step.
                        </p>

                        <div className="flex flex-wrap gap-3 mt-4">
                            <button
                                onClick={() => downloadTemplate("xlsx")}
                                className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                Excel template (.xlsx)
                            </button>
                            <button
                                onClick={() => downloadTemplate("csv")}
                                className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                CSV template
                            </button>
                        </div>

                        <div className="mt-5 overflow-x-auto">
                            <table className="text-xs border border-gray-100 rounded-lg">
                                <thead>
                                    <tr className="bg-gray-50/80">
                                        {TEMPLATE_GRID[0].map((h) => (
                                            <th key={h} className="text-left font-semibold text-gray-600 px-3 py-2 whitespace-nowrap border-b border-gray-100">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {TEMPLATE_GRID.slice(1).map((row, i) => (
                                        <tr key={i}>
                                            {row.map((cell, j) => (
                                                <td key={j} className="px-3 py-2 text-gray-500 whitespace-nowrap font-mono">
                                                    {cell || <span className="text-gray-300">—</span>}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                            Row 1 = both channels · Row 2 = email only · Row 3 = WhatsApp only. Include the country code
                            on numbers, or pick a default country on the next step. Prefer the Excel template —
                            Excel turns long numbers in a CSV into 9.19E+11.
                        </p>
                    </div>
                </div>
            )}

            {/* Step: Map Columns */}
            {step === "map" && file && (
                <div className="space-y-6">
                    {/* File info */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{file.name}</p>
                            <p className="text-sm text-gray-500">
                                {(file.size / 1024).toFixed(1)} KB · {rows.length.toLocaleString()} rows
                            </p>
                        </div>
                        <button onClick={reset} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* List Selection */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-600" />
                            Target List
                        </h3>
                        {listIdFromUrl && activeList ? (
                            <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-sm flex items-center justify-between">
                                <span className="font-medium text-gray-900">{activeList.name}</span>
                                <span className="text-gray-500 text-xs">{activeList.contactCount} contacts</span>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-sm text-gray-500">Select which list to add these contacts to.</p>
                                <select
                                    value={selectedListId}
                                    onChange={(e) => setSelectedListId(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all bg-white"
                                    disabled={isLoadingLists}
                                >
                                    <option value="">Select a contact list...</option>
                                    {lists.map((list) => (
                                        <option key={list.id} value={list.id}>
                                            {list.name} ({list.contactCount} contacts)
                                        </option>
                                    ))}
                                </select>
                                {lists.length === 0 && !isLoadingLists && (
                                    <p className="text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                                        You don&apos;t have any contact lists. Please <Link href="/dashboard/contacts" className="underline font-medium">create one</Link> first.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Column mapping */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-1">Map Columns</h3>
                        <p className="text-sm text-gray-500 mb-5">
                            A contact holds these four fields. Columns were matched automatically by name — adjust
                            anything that looks wrong. Map at least one sending channel (email or WhatsApp).
                        </p>

                        <div className="space-y-3">
                            {CONTACT_IMPORT_FIELDS.map(renderFieldRow)}
                        </div>
                    </div>

                    {/* Import options */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
                        <h3 className="font-semibold text-gray-900">Options</h3>

                        <div className="flex items-start gap-4">
                            <div className="w-44 shrink-0 pt-2.5">
                                <span className="text-sm font-medium text-gray-700">Default country</span>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Used for numbers written without a country code
                                </p>
                            </div>
                            <select
                                value={defaultCountry}
                                onChange={(e) => setDefaultCountry(e.target.value as CountryCode | "")}
                                className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all bg-white"
                            >
                                <option value="">None — numbers must include the country code</option>
                                {countryOptions.map((c) => (
                                    <option key={c.code} value={c.code}>{c.label}</option>
                                ))}
                            </select>
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={whatsappOptInDefault}
                                onChange={(e) => setWhatsappOptInDefault(e.target.checked)}
                                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600/20"
                            />
                            <span className="text-sm text-gray-700">
                                These contacts opted in to WhatsApp messages
                                <span className="block text-xs text-gray-400 mt-0.5">
                                    Applies to every row in this file. Contacts without opt-in are skipped by every
                                    WhatsApp send — Meta requires prior consent.
                                </span>
                            </span>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={updateExisting}
                                onChange={(e) => setUpdateExisting(e.target.checked)}
                                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600/20"
                            />
                            <span className="text-sm text-gray-700">
                                Update contacts that already exist
                                <span className="block text-xs text-gray-400 mt-0.5">
                                    Fills in missing fields instead of skipping the row — useful for adding WhatsApp
                                    numbers to an existing email list.
                                </span>
                            </span>
                        </label>
                    </div>

                    {/* Channel readiness */}
                    <div className="bg-white rounded-2xl border border-gray-100 p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">What this file will import</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <ReadinessTile icon={<Mail className="w-4 h-4" />} label="Email ready" value={stats.emailReady} tone="blue" />
                            <ReadinessTile icon={<MessageCircle className="w-4 h-4" />} label="WhatsApp ready" value={stats.whatsappReady} tone="green" />
                            <ReadinessTile label="Duplicates in file" value={stats.duplicates} tone="amber" />
                            <ReadinessTile label="Unusable rows" value={stats.invalid} tone="red" />
                        </div>
                        {stats.both > 0 && (
                            <p className="text-xs text-gray-500 mt-3">
                                {stats.both.toLocaleString()} contact(s) reachable on both channels.
                            </p>
                        )}
                        {stats.invalid > 0 && !defaultCountry && mapping.whatsappNumber && (
                            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
                                Some numbers could not be parsed. If your file omits the country code, pick a default
                                country above.
                            </p>
                        )}
                    </div>

                    {/* Preview */}
                    {previewRows.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Preview (first {previewRows.length} rows)</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            {headers.map((h) => (
                                                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-4 whitespace-nowrap">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {previewRows.map((row, i) => (
                                            <tr key={i}>
                                                {headers.map((h) => (
                                                    <td key={h} className="py-2 pr-4 text-gray-600 truncate max-w-[150px]">{row[h] || "—"}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {parseError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {parseError}
                        </div>
                    )}

                    {!activeListId && (
                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            No contact list selected. Use the selector above to pick a list.
                        </div>
                    )}

                    {!mapping.email && !mapping.whatsappNumber && (
                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            Map an Email column, a WhatsApp number column, or both.
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={reset}
                            className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={!canImport || isImporting}
                            className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {isImporting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isImporting ? "Importing..." : `Import ${stats.usable.toLocaleString()} Contacts`}
                        </button>
                    </div>
                </div>
            )}

            {/* Step: Result */}
            {step === "result" && importResult && (
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-7 h-7 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Import Complete</h2>
                        <p className="text-gray-500 text-sm">
                            {importResult.emailReady.toLocaleString()} ready for email ·{" "}
                            {importResult.whatsappReady.toLocaleString()} ready for WhatsApp
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <StatTile value={importResult.imported} label="Imported" className="text-green-600" />
                        <StatTile value={importResult.updated} label="Updated" className="text-blue-600" />
                        <StatTile value={importResult.skipped} label="Skipped (duplicates)" className="text-amber-500" />
                        <StatTile value={importResult.errors} label="Errors" className="text-red-500" />
                    </div>

                    {importResult.limitReached && (
                        <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            Your plan&apos;s contact limit was reached — the remaining rows were not imported.{" "}
                            <Link href="/dashboard/billing" className="underline font-medium">Upgrade</Link>
                        </div>
                    )}

                    {importResult.errorDetails.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                Error Details
                            </h3>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {importResult.errorDetails.map((err, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm">
                                        <span className="text-gray-400 w-14 shrink-0">{err.row ? `Row ${err.row}` : "—"}</span>
                                        <span className="text-gray-700 flex-1 truncate">{err.identifier}</span>
                                        <span className="text-red-500 shrink-0 max-w-[45%] truncate" title={err.reason}>{err.reason}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={reset}
                            className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Import Another File
                        </button>
                        <button
                            onClick={() => activeListId ? router.push(`/dashboard/contacts/${activeListId}`) : router.push("/dashboard/contacts")}
                            className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            View Contacts
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const TONES: Record<string, string> = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50",
    amber: "text-amber-500 bg-amber-50",
    red: "text-red-500 bg-red-50",
};

function ReadinessTile({ icon, label, value, tone }: { icon?: React.ReactNode; label: string; value: number; tone: string }) {
    return (
        <div className="rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-1">
                {icon && <span className={`w-6 h-6 rounded-lg flex items-center justify-center ${TONES[tone]}`}>{icon}</span>}
                <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className={`text-2xl font-bold ${TONES[tone].split(" ")[0]}`}>{value.toLocaleString()}</p>
        </div>
    );
}

function StatTile({ value, label, className }: { value: number; label: string; className: string }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
            <p className={`text-3xl font-bold ${className}`}>{value.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
        </div>
    );
}

export default function UploadPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        }>
            <UploadPageContent />
        </Suspense>
    );
}
