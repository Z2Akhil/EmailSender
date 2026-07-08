import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Workspace } from "@/models/Workspace";
import { Campaign } from "@/models/Campaign";
import { Contact } from "@/models/Contact";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

export const dynamic = "force-dynamic";

/**
 * Server gate: brand-new workspaces (no onboarding record, no activity)
 * get routed to the welcome wizard once. Existing/active workspaces —
 * including ones created before the onboarding fields existed — never
 * see it because the activity check short-circuits.
 */
export default async function DashboardPage() {
    const session = await getServerSession(authOptions);

    // Layout already redirects unauthenticated users; this is belt & braces
    if (session?.user?.workspaceId) {
        await connectDB();
        const workspace = await Workspace.findById(session.user.workspaceId)
            .select("onboardingCompletedAt");

        if (workspace && !workspace.onboardingCompletedAt) {
            const [hasCampaign, hasContact] = await Promise.all([
                Campaign.exists({ workspaceId: session.user.workspaceId }),
                Contact.exists({ workspaceId: session.user.workspaceId }),
            ]);
            if (!hasCampaign && !hasContact) {
                redirect("/dashboard/welcome");
            }
        }
    }

    return <DashboardHome />;
}
