"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft, Plus, Upload, Download, Search, Loader2, Users
} from "lucide-react";
import Link from "next/link";
import { Contact, ContactStatus, ApiResponse } from "@/types";
import { ContactsTable } from "@/components/contacts/ContactsTable";
import { AddContactModal } from "@/components/contacts/AddContactModal";

interface ContactsResponse {
    data: Contact[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        listName: string;
    };
}

const STATUS_FILTERS: { label: string; value: string }[] = [
    { label: "All", value: "" },
    { label: "Active", value: "ACTIVE" },
    { label: "Unsubscribed", value: "UNSUBSCRIBED" },
    { label: "Bounced", value: "BOUNCED" },
];

export default function ContactListDetailPage() {
    const params = useParams();
    const router = useRouter();
    const listId = params.listId as string;
    const queryClient = useQueryClient();

    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const { data, isLoading } = useQuery<ContactsResponse>({
        queryKey: ["contacts", listId, page, search, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: String(page),
                limit: "50",
                ...(search && { search }),
                ...(statusFilter && { status: statusFilter }),
            });
            const res = await fetch(`/api/contacts/lists/${listId}/contacts?${params}`);
            if (!res.ok) throw new Error("Failed to fetch contacts");
            return res.json();
        },
    });

    const addContactMutation = useMutation({
        mutationFn: async (contactData: Partial<Contact>) => {
            const res = await fetch(`/api/contacts/lists/${listId}/contacts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(contactData),
            });
            const json: ApiResponse<Contact> = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to add contact");
            return json;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contacts", listId] });
            queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
        },
    });

    const deleteContactMutation = useMutation({
        mutationFn: async (contactId: string) => {
            const res = await fetch(`/api/contacts/${contactId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete contact");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contacts", listId] });
            queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
        },
    });

    const statusChangeMutation = useMutation({
        mutationFn: async ({ contactId, status }: { contactId: string; status: ContactStatus }) => {
            const res = await fetch(`/api/contacts/${contactId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Failed to update contact");
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contacts", listId] });
        },
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPage(1);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this contact?")) {
            await deleteContactMutation.mutateAsync(id);
        }
    };

    const handleStatusChange = async (id: string, status: ContactStatus) => {
        await statusChangeMutation.mutateAsync({ contactId: id, status });
    };

    const handleExport = () => {
        window.open(`/api/contacts/lists/${listId}/export`, "_blank");
    };

    const listName = data?.meta?.listName || "Contact List";
    const contacts = data?.data || [];
    const meta = data?.meta;

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/dashboard/contacts")}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{listName}</h1>
                        <p className="text-gray-500 mt-0.5 text-sm">
                            {meta ? `${meta.total} contact${meta.total !== 1 ? "s" : ""}` : "Loading..."}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                    <Link
                        href={`/dashboard/contacts/upload?listId=${listId}`}
                        className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        Import CSV
                    </Link>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add Contact
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                {/* Search */}
                <form onSubmit={handleSearch} className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search contacts..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all shadow-sm"
                    />
                </form>

                {/* Status filter */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                    {STATUS_FILTERS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => { setStatusFilter(f.value); setPage(1); }}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${statusFilter === f.value
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Empty state */}
            {!isLoading && contacts.length === 0 && !search && !statusFilter ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">No contacts yet</h2>
                    <p className="text-gray-500 text-sm max-w-sm mb-6">
                        Add contacts manually or import a CSV file to get started.
                    </p>
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/dashboard/contacts/upload?listId=${listId}`}
                            className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            Import CSV
                        </Link>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Contact
                        </button>
                    </div>
                </div>
            ) : (
                <ContactsTable
                    contacts={contacts}
                    total={meta?.total ?? 0}
                    page={page}
                    totalPages={meta?.totalPages ?? 1}
                    onPageChange={setPage}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    isLoading={isLoading}
                />
            )}

            {/* Loading indicator for mutations */}
            {(deleteContactMutation.isPending || statusChangeMutation.isPending) && (
                <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-lg border border-gray-100 px-4 py-3 flex items-center gap-2 text-sm text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    Updating...
                </div>
            )}

            <AddContactModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={async (data) => {
                    await addContactMutation.mutateAsync(data);
                }}
            />
        </div>
    );
}
