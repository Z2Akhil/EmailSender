import { Users, Upload, Plus } from "lucide-react";
import Link from "next/link";

export default function ContactsPage() {
    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
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
                    <button className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
                        <Plus className="w-4 h-4" />
                        New List
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                    <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">No contact lists yet</h2>
                <p className="text-gray-500 text-sm max-w-sm">
                    Import a CSV file or create a list manually to start managing your contacts.
                </p>
                <div className="flex items-center gap-3 mt-6">
                    <Link
                        href="/dashboard/contacts/upload"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        Import contacts
                    </Link>
                </div>
            </div>
        </div>
    );
}
