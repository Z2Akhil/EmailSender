import { Settings, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your account and workspace settings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/dashboard/settings/workspace" className="group">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-200 hover:ring-4 hover:ring-blue-50 transition-all">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <SettingsIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">General Settings</h2>
                        <p className="text-gray-500 text-sm">
                            Manage your workspace name and general preferences.
                        </p>
                    </div>
                </Link>

                <Link href="/dashboard/settings/domains" className="group">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-200 hover:ring-4 hover:ring-blue-50 transition-all">
                        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <SettingsIcon className="w-6 h-6 text-amber-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">Sending Domains</h2>
                        <p className="text-gray-500 text-sm">
                            Authenticate and manage your sending domains with SES.
                        </p>
                    </div>
                </Link>

                <Link href="/dashboard/settings/smtp" className="group">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-blue-200 hover:ring-4 hover:ring-blue-50 transition-all">
                        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <SettingsIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">SMTP Settings</h2>
                        <p className="text-gray-500 text-sm">
                            Configure custom SMTP servers for email delivery.
                        </p>
                    </div>
                </Link>
                <Link href="/dashboard/settings/whatsapp" className="group">
                    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-green-200 hover:ring-4 hover:ring-green-50 transition-all">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <SettingsIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">WhatsApp Integration</h2>
                        <p className="text-gray-500 text-sm">
                            Connect your Meta Business account for WhatsApp messaging.
                        </p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
