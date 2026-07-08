import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Workspace } from "@/models/Workspace";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.workspaceId) {
        redirect("/login");
    }

    await connectDB();
    const workspace = await Workspace.findById(session.user.workspaceId)
        .select("name onboardingCompletedAt");

    // No re-entry once finished or skipped
    if (!workspace || workspace.onboardingCompletedAt) {
        redirect("/dashboard");
    }

    return (
        <OnboardingWizard
            workspaceName={workspace.name}
            userEmail={session.user.email || ""}
            isProfileComplete={session.user.isProfileComplete !== false}
        />
    );
}
