"use client";

import { MoreVertical, Users, ExternalLink, Pencil, Trash2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { ContactList } from "@/types";

interface ContactListCardProps {
    list: ContactList;
    onRename: (list: ContactList) => void;
    onDelete: (id: string) => void;
}

export function ContactListCard({ list, onRename, onDelete }: ContactListCardProps) {
    return (
        <div className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <Users className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger className="p-1 hover:bg-gray-100 rounded-lg transition-colors outline-none text-gray-400 hover:text-gray-600">
                        <MoreVertical className="w-5 h-5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => onRename(list)}
                        >
                            <Pencil className="w-4 h-4" />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="flex items-center gap-2 text-red-600 focus:text-red-600 cursor-pointer"
                            onClick={() => onDelete(list.id)}
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="mb-6">
                <h3 className="text-gray-900 font-semibold truncate" title={list.name}>
                    {list.name}
                </h3>
                <p className="text-gray-500 text-sm mt-0.5">
                    {list.contactCount} {list.contactCount === 1 ? "contact" : "contacts"}
                </p>
            </div>

            <Link
                href={`/dashboard/contacts/${list.id}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-gray-50 text-gray-700 text-sm font-medium py-2 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
            >
                View contacts
                <ExternalLink className="w-3.5 h-3.5" />
            </Link>
        </div>
    );
}
