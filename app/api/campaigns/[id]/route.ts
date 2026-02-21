import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { z } from "zod";

const campaignUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    subject: z.string().min(1).optional(),
    fromName: z.string().min(1).optional(),
    fromEmail: z.string().email().optional(),
    replyTo: z.string().email().optional().or(z.literal("")),
    templateId: z.string().optional(),
    htmlContent: z.string().optional(),
    recipientListId: z.string().optional(),
    domainId: z.string().optional(),
    status: z.enum(["DRAFT", "SCHEDULED", "SENDING", "SENT", "ARCHIVED"]).optional(),
    scheduledAt: z.string().datetime().nullable().optional(),
});

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const campaign = await Campaign.findOne({
            _id: id,
            workspaceId: session.user.workspaceId
        });

        if (!campaign) {
            return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: campaign });
    } catch (error) {
        console.error("[CAMPAIGN_GET]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validated = campaignUpdateSchema.parse(body);

        await connectDB();

        const campaign = await Campaign.findOneAndUpdate(
            { _id: id, workspaceId: session.user.workspaceId },
            { $set: validated },
            { new: true }
        );

        if (!campaign) {
            return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: campaign });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
        }
        console.error("[CAMPAIGN_PATCH]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const campaign = await Campaign.findOneAndDelete({
            _id: id,
            workspaceId: session.user.workspaceId
        });

        if (!campaign) {
            return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Campaign deleted successfully" });
    } catch (error) {
        console.error("[CAMPAIGN_DELETE]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
