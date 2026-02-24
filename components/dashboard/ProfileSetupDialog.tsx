"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, User, Mail, X } from "lucide-react";

interface ProfileSetupDialogProps {
    defaultName?: string;
    defaultEmail?: string;
}

export function ProfileSetupDialog({ defaultName = "", defaultEmail = "" }: ProfileSetupDialogProps) {
    const { update } = useSession();
    const router = useRouter();
    const [name, setName] = useState(defaultName);
    const [isLoading, setIsLoading] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);
    const [error, setError] = useState("");

    const handleSkip = async () => {
        setIsSkipping(true);
        setError("");
        try {
            const res = await fetch("/api/users/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: defaultName || "User" }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to mark profile as complete");
            }

            await update();
            window.location.reload();
        } catch (err: any) {
            setError(err.message);
            setIsSkipping(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/users/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to update profile");
            }

            // Force session update to fetch new isProfileComplete and name
            await update();

            // Refresh the whole page to ensure session is re-fetched everywhere
            window.location.reload();
        } catch (err: any) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={handleSkip}
                    disabled={isLoading || isSkipping}
                    className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                    aria-label="Skip and close"
                >
                    {isSkipping ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                </button>

                <div className="mb-6 mr-6">
                    <h2 className="text-xl font-bold text-gray-900">Complete Your Profile</h2>
                    <p className="text-sm text-gray-500 mt-1">Please confirm your details before continuing to the dashboard.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                value={defaultEmail}
                                disabled
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                            Full Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Your full name"
                                disabled={isLoading || isSkipping}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
                                autoFocus
                            />
                        </div>
                        {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || isSkipping}
                        className="w-full mt-6 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save and Continue
                    </button>
                </form>
            </div>
        </div>
    );
}
