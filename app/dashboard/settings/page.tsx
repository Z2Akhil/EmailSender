import { Settings } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-500 mt-1">Manage your account and workspace settings</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                    <Settings className="w-6 h-6 text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Settings coming soon</h2>
                <p className="text-gray-500 text-sm max-w-sm">
                    Account settings, SMTP configuration, and billing will be available in upcoming phases.
                </p>
            </div>
        </div>
    );
}
