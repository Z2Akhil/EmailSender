"use client";

import { useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Upload, FileText, X, CheckCircle, AlertCircle, ChevronRight, Loader2, ArrowLeft, Layers } from "lucide-react";
import { Contact, ApiResponse, ContactList } from "@/types";

interface ColumnMapping {
    email: string;
    firstName: string;
    lastName: string;
    company: string;
    phone: string;
}

interface ImportResult {
    imported: number;
    skipped: number;
    errors: number;
    total: number;
    errorDetails: { row: number; email: string; reason: string }[];
}

interface PreviewRow {
    [key: string]: string;
}

function UploadPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const listIdFromUrl = searchParams.get("listId");

    const [step, setStep] = useState<"upload" | "map" | "preview" | "result">("upload");
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
    const [mapping, setMapping] = useState<ColumnMapping>({
        email: "",
        firstName: "",
        lastName: "",
        company: "",
        phone: "",
    });
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
    const activeList = lists.find(l => l.id === activeListId);

    const parseFileHeaders = async (f: File) => {
        setParseError("");
        const name = f.name.toLowerCase();

        if (name.endsWith(".csv")) {
            const text = await f.text();
            const lines = text.split("\n").filter((l) => l.trim());
            if (lines.length === 0) {
                setParseError("File is empty");
                return;
            }
            const cols = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
            setHeaders(cols);
            const rows = lines.slice(1, 6).map((line) => {
                const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
                return Object.fromEntries(cols.map((col, i) => [col, vals[i] ?? ""]));
            });
            setPreviewRows(rows);
            // Auto-map common column names
            autoMap(cols);
        } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
            // For Excel, we'll rely on server-side parsing — just show filename
            setHeaders(["(Excel file — columns will be auto-detected on import)"]);
            setPreviewRows([]);
        } else {
            setParseError("Unsupported file type. Please upload a .csv or .xlsx file.");
            return;
        }
        setFile(f);
        setStep("map");
    };

    const autoMap = (cols: string[]) => {
        const lower = cols.map((c) => c.toLowerCase());
        const find = (keys: string[]) => cols[keys.map((k) => lower.indexOf(k)).find((i) => i >= 0) ?? -1] ?? "";
        setMapping({
            email: find(["email", "email address", "e-mail"]),
            firstName: find(["firstname", "first_name", "first name", "fname"]),
            lastName: find(["lastname", "last_name", "last name", "lname"]),
            company: find(["company", "organization", "org"]),
            phone: find(["phone", "phone number", "mobile", "tel"]),
        });
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) parseFileHeaders(f);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) parseFileHeaders(f);
    };

    const handleImport = async () => {
        if (!file || !activeListId || !mapping.email) return;
        setIsImporting(true);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("mapping", JSON.stringify(mapping));

        try {
            const res = await fetch(`/api/contacts/lists/${activeListId}/import`, {
                method: "POST",
                body: formData,
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Import failed");
            setImportResult(json.data);
            setStep("result");
        } catch (err: unknown) {
            const e = err as Error;
            setParseError(e.message);
        } finally {
            setIsImporting(false);
        }
    };

    const reset = () => {
        setStep("upload");
        setFile(null);
        setHeaders([]);
        setPreviewRows([]);
        setMapping({ email: "", firstName: "", lastName: "", company: "", phone: "" });
        setImportResult(null);
        setParseError("");
    };

    return (
        <div className="max-w-2xl mx-auto">
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
                    <p className="text-gray-500 mt-0.5 text-sm">Upload a CSV or Excel file to import contacts</p>
                </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
                {["Upload", "Map Columns", "Import"].map((label, i) => {
                    const stepKeys = ["upload", "map", "result"];
                    const currentIdx = stepKeys.indexOf(step === "preview" ? "map" : step);
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
                    <p className="text-xs text-gray-400">Supports .csv and .xlsx files</p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                    />
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
                            <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
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
                        <h3 className="font-semibold text-gray-900 mb-4">Map Columns</h3>
                        <p className="text-sm text-gray-500 mb-5">Match your file&apos;s columns to contact fields.</p>

                        <div className="space-y-4">
                            {[
                                { key: "email", label: "Email", required: true },
                                { key: "firstName", label: "First Name" },
                                { key: "lastName", label: "Last Name" },
                                { key: "company", label: "Company" },
                                { key: "phone", label: "Phone" },
                            ].map(({ key, label, required }) => (
                                <div key={key} className="flex items-center gap-4">
                                    <label className="w-32 text-sm font-medium text-gray-700 shrink-0">
                                        {label} {required && <span className="text-red-500">*</span>}
                                    </label>
                                    <select
                                        value={mapping[key as keyof ColumnMapping]}
                                        onChange={(e) => setMapping((m) => ({ ...m, [key]: e.target.value }))}
                                        className="flex-1 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all bg-white"
                                    >
                                        <option value="">(skip)</option>
                                        {headers.map((h) => (
                                            <option key={h} value={h}>{h}</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
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
                                                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide pb-2 pr-4">{h}</th>
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

                    <div className="flex gap-3">
                        <button
                            onClick={reset}
                            className="flex-1 border border-gray-200 text-gray-700 text-sm font-medium py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Back
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={!mapping.email || !activeListId || isImporting}
                            className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {isImporting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isImporting ? "Importing..." : "Import Contacts"}
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
                        <p className="text-gray-500 text-sm">Here&apos;s a summary of your import</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                            <p className="text-3xl font-bold text-green-600">{importResult.imported}</p>
                            <p className="text-sm text-gray-500 mt-1">Imported</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                            <p className="text-3xl font-bold text-amber-500">{importResult.skipped}</p>
                            <p className="text-sm text-gray-500 mt-1">Skipped (duplicates)</p>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                            <p className="text-3xl font-bold text-red-500">{importResult.errors}</p>
                            <p className="text-sm text-gray-500 mt-1">Errors</p>
                        </div>
                    </div>

                    {importResult.errorDetails.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-6">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                Error Details
                            </h3>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {importResult.errorDetails.map((err, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm">
                                        <span className="text-gray-400 w-12 shrink-0">Row {err.row}</span>
                                        <span className="text-gray-700 flex-1 truncate">{err.email}</span>
                                        <span className="text-red-500 shrink-0">{err.reason}</span>
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
