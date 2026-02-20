"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Loader2, Save, Building } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiResponse } from "@/types";

interface WorkspaceInfo {
    name: string;
    planTier: string;
}

export default function WorkspaceSettingsPage() {
    const queryClient = useQueryClient();
    const [name, setName] = useState("");

    const { data: workspaceData, isLoading } = useQuery<ApiResponse<WorkspaceInfo>>({
        queryKey: ["settings-workspace"],
        queryFn: async () => {
            const res = await fetch("/api/settings/workspace");
            return res.json();
        },
    });

    useEffect(() => {
        if (workspaceData?.data) {
            setName(workspaceData.data.name);
        }
    }, [workspaceData]);

    const updateMutation = useMutation({
        mutationFn: async (newName: string) => {
            const res = await fetch("/api/settings/workspace", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newName }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to update workspace");
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["settings-workspace"] });
            alert("Workspace settings updated successfully!");
        },
        onError: (error: any) => {
            alert(error.message);
        }
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading workspace settings...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pb-20">
            <div className="mb-8">
                <Link
                    href="/dashboard/settings"
                    className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors group"
                >
                    <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-0.5 transition-transform" />
                    Back to Settings
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">General Settings</h1>
                <p className="text-gray-500 mt-1">Manage your workspace identity and preferences</p>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-8">
                <div className="space-y-6">
                    <div className="flex items-center gap-4 pb-6 border-b border-gray-50">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Building className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Workspace Profile</h3>
                            <p className="text-xs text-gray-500">Visible to all members of your workspace</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Workspace Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-medium"
                            placeholder="Enter workspace name"
                        />
                        <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">Max 50 characters</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Current Plan</label>
                        <div className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
                            <span className="font-semibold text-gray-900">{workspaceData?.data?.planTier}</span>
                            <Link href="/dashboard/settings/billing" className="text-blue-600 font-bold text-xs uppercase hover:underline">
                                Upgrade plan
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        onClick={() => updateMutation.mutate(name)}
                        disabled={updateMutation.isPending || !name || name === workspaceData?.data?.name}
                        className="bg-blue-600 text-white text-sm font-bold px-8 py-3 rounded-2xl flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-100 active:scale-95"
                    >
                        {updateMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
