"use client";

import { Users, Upload, Plus, Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ContactList, ApiResponse } from "@/types";
import { ContactListCard } from "@/components/contacts/ContactListCard";
import { CreateListModal } from "@/components/contacts/CreateListModal";

export default function ContactsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingList, setEditingList] = useState<ContactList | undefined>();
    const [searchQuery, setSearchQuery] = useState("");

    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery<ApiResponse<ContactList[]>>({
        queryKey: ["contact-lists"],
        queryFn: async () => {
            const res = await fetch("/api/contacts/lists");
            if (!res.ok) throw new Error("Failed to fetch lists");
            return res.json();
        },
    });

    const createMutation = useMutation({
        mutationFn: async (name: string) => {
            const res = await fetch("/api/contacts/lists", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error("Failed to create list");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (name: string) => {
            if (!editingList) return;
            const res = await fetch(`/api/contacts/lists/${editingList.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });
            if (!res.ok) throw new Error("Failed to update list");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/contacts/lists/${id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete list");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contact-lists"] });
        },
    });

    const lists = data?.data || [];
    const filteredLists = lists.filter((list) =>
        list.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateClick = () => {
        setEditingList(undefined);
        setIsModalOpen(true);
    };

    const handleRenameClick = (list: ContactList) => {
        setEditingList(list);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (id: string) => {
        if (confirm("Are you sure you want to delete this list and all its contacts?")) {
            await deleteMutation.mutateAsync(id);
        }
    };

    const handleModalSubmit = async (name: string) => {
        if (editingList) {
            await updateMutation.mutateAsync(name);
        } else {
            await createMutation.mutateAsync(name);
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
                    <p className="text-gray-500 mt-1">Manage your contact lists and audiences</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/contacts/upload"
                        className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        Import CSV
                    </Link>
                    <button
                        onClick={handleCreateClick}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New List
                    </button>
                </div>
            </div>

            {/* Search & Stats */}
            {!isLoading && lists.length > 0 && (
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search lists..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all shadow-sm"
                        />
                    </div>
                </div>
            )}

            {/* Content */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-gray-500 text-sm mt-4">Loading your lists...</p>
                </div>
            ) : filteredLists.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLists.map((list) => (
                        <ContactListCard
                            key={list.id}
                            list={list}
                            onRename={handleRenameClick}
                            onDelete={handleDeleteClick}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                        <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchQuery ? "No lists matches your search" : "No contact lists yet"}
                    </h2>
                    <p className="text-gray-500 text-sm max-w-sm">
                        {searchQuery
                            ? "Try searching for a different name or clear the filter."
                            : "Import a CSV file or create a list manually to start managing your contacts."}
                    </p>
                    <div className="flex items-center gap-3 mt-6">
                        {searchQuery ? (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                            >
                                Clear search
                            </button>
                        ) : (
                            <Link
                                href="/dashboard/contacts/upload"
                                className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Import contacts
                            </Link>
                        )}
                    </div>
                </div>
            )}

            <CreateListModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleModalSubmit}
                initialData={editingList}
            />
        </div>
    );
}
