import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Workspace } from "@/models/Workspace";
import { redirect } from "next/navigation";
import WhatsappSettingsForm from "./WhatsappSettingsForm";

export default async function WhatsappSettingsPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        redirect("/login");
    }

    await connectDB();
    const workspace = await Workspace.findById(session.user.workspaceId);

    if (!workspace) {
        redirect("/dashboard");
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">WhatsApp Integration</h1>
                <p className="text-gray-500 mt-1">Configure your Meta Business API credentials to send WhatsApp messages.</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6">
                    <WhatsappSettingsForm
                        initialPhoneNumberId={workspace.whatsappPhoneNumberId || ""}
                        initialBusinessAccountId={workspace.whatsappBusinessAccountId || ""}
                        isConfigured={!!workspace.whatsappAccessToken}
                    />
                </div>
            </div>
        </div>
    );
}
