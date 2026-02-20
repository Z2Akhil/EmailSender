"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { CampaignForm } from "@/components/campaigns/CampaignForm";
import { ApiResponse, Campaign } from "@/types";
import { Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const { data: campaignData, isLoading, error } = useQuery<ApiResponse<Campaign>>({
        queryKey: ["campaign", id],
        queryFn: async () => {
            const res = await fetch(`/api/campaigns/${id}`);
            if (!res.ok) throw new Error("Failed to fetch campaign");
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading campaign details...</p>
            </div>
        );
    }

    if (error || !campaignData?.success) {
        return (
            <div className="max-w-2xl mx-auto text-center py-20">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <ArrowLeft className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign not found</h2>
                <p className="text-gray-500 mb-8">
                    The campaign you are looking for does not exist or you do not have permission to view it.
                </p>
                <button
                    onClick={() => router.push("/dashboard/campaigns")}
                    className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Campaigns
                </button>
            </div>
        );
    }

    return <CampaignForm initialData={campaignData.data} isEditing />;
}
