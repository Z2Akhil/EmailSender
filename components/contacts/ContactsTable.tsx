"use client";

import { Contact, ContactStatus } from "@/types";
import { Trash2, UserMinus, UserCheck, ChevronLeft, ChevronRight } from "lucide-react";

interface ContactsTableProps {
    contacts: Contact[];
    total: number;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: ContactStatus) => void;
    isLoading?: boolean;
}

const STATUS_BADGE: Record<ContactStatus, string> = {
    ACTIVE: "bg-green-50 text-green-700 border-green-100",
    UNSUBSCRIBED: "bg-amber-50 text-amber-700 border-amber-100",
    BOUNCED: "bg-red-50 text-red-700 border-red-100",
};

const STATUS_LABEL: Record<ContactStatus, string> = {
    ACTIVE: "Active",
    UNSUBSCRIBED: "Unsubscribed",
    BOUNCED: "Bounced",
};

export function ContactsTable({
    contacts,
    total,
    page,
    totalPages,
    onPageChange,
    onDelete,
    onStatusChange,
    isLoading,
}: ContactsTableProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="divide-y divide-gray-50">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-100 rounded w-48" />
                                <div className="h-3 bg-gray-100 rounded w-32" />
                            </div>
                            <div className="h-6 bg-gray-100 rounded-full w-20" />
                            <div className="h-4 bg-gray-100 rounded w-24" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (contacts.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <p className="text-gray-500 text-sm">No contacts found</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/60">
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-6 py-3.5">Email</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Name</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5 hidden md:table-cell">Company</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5 hidden sm:table-cell">WhatsApp</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5">Status</th>
                            <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3.5 hidden lg:table-cell">Added</th>
                            <th className="px-4 py-3.5" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {contacts.map((contact) => (
                            <tr key={contact.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="font-medium text-gray-900">{contact.email}</span>
                                </td>
                                <td className="px-4 py-4 text-gray-600">
                                    {contact.firstName || contact.lastName
                                        ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim()
                                        : <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-4 text-gray-600 hidden md:table-cell">
                                    {contact.company || <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-4 text-gray-600 hidden sm:table-cell font-mono text-xs">
                                    {contact.whatsappNumber || <span className="text-gray-300">—</span>}
                                </td>
                                <td className="px-4 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_BADGE[contact.status]}`}>
                                        {STATUS_LABEL[contact.status]}
                                    </span>
                                </td>
                                <td className="px-4 py-4 text-gray-500 hidden lg:table-cell">
                                    {new Date(contact.createdAt).toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                    })}
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {contact.status === "ACTIVE" ? (
                                            <button
                                                onClick={() => onStatusChange(contact.id, "UNSUBSCRIBED")}
                                                title="Unsubscribe"
                                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                            >
                                                <UserMinus className="w-4 h-4" />
                                            </button>
                                        ) : contact.status === "UNSUBSCRIBED" ? (
                                            <button
                                                onClick={() => onStatusChange(contact.id, "ACTIVE")}
                                                title="Reactivate"
                                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            >
                                                <UserCheck className="w-4 h-4" />
                                            </button>
                                        ) : null}
                                        <button
                                            onClick={() => onDelete(contact.id)}
                                            title="Delete"
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                        {total} contact{total !== 1 ? "s" : ""} total
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onPageChange(page - 1)}
                            disabled={page <= 1}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-gray-600 px-2">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => onPageChange(page + 1)}
                            disabled={page >= totalPages}
                            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
