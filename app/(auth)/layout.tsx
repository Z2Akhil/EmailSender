import { Mail } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
            {/* Header */}
            <div className="p-6">
                <Link href="/" className="inline-flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Mail className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">BulkMailer</span>
                </Link>
            </div>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">{children}</div>
            </div>

            {/* Footer */}
            <div className="p-6 text-center">
                <p className="text-sm text-gray-400">
                    © {new Date().getFullYear()} BulkMailer. All rights reserved.
                </p>
            </div>
        </div>
    );
}
