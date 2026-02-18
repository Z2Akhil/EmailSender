import { Mail, Plus } from "lucide-react";
import Link from "next/link";

export default function CampaignsPage() {
    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
                    <p className="text-gray-500 mt-1">Create and manage your email campaigns</p>
                </div>
                <Link
                    href="/dashboard/campaigns/new"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Campaign
                </Link>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h2>
                <p className="text-gray-500 text-sm max-w-sm">
                    Create your first email campaign and start reaching your audience.
                </p>
                <Link
                    href="/dashboard/campaigns/new"
                    className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create campaign
                </Link>
            </div>
        </div>
    );
}
