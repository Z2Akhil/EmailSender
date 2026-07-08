import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-utils";
import { connectDB } from "@/lib/db";
import { Workspace } from "@/models/Workspace";
import { z } from "zod";

const actionSchema = z.object({
    action: z.enum(["complete", "skip", "dismiss-checklist"]),
});

/**
 * POST /api/onboarding
 * Records onboarding wizard completion/skip and setup-checklist dismissal
 * on the workspace.
 */
export async function POST(req: NextRequest) {
    const { session, response } = await requireAuth();
    if (!session) return response;

    try {
        const body = await req.json();
        const { action } = actionSchema.parse(body);

        await connectDB();

        const update =
            action === "complete" ? { onboardingCompletedAt: new Date(), onboardingSkipped: false } :
            action === "skip" ? { onboardingCompletedAt: new Date(), onboardingSkipped: true } :
            { checklistDismissedAt: new Date() };

        await Workspace.findByIdAndUpdate(session.user.workspaceId, update);

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
        }
        console.error("[ONBOARDING]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
