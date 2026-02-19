import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { z } from "zod";

const campaignSchema = z.object({
    name: z.string().min(1, "Campaign name is required"),
    subject: z.string().min(1, "Subject is required"),
    fromName: z.string().min(1, "From name is required"),
    fromEmail: z.string().email("Invalid from email"),
    replyTo: z.string().email("Invalid reply-to email").optional().or(z.literal("")),
    templateId: z.string().optional(),
    htmlContent: z.string().min(1, "Content is required"),
    recipientListId: z.string().min(1, "Recipient list is required"),
});

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const campaigns = await Campaign.find({
            workspaceId: session.user.workspaceId
        }).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: campaigns });
    } catch (error) {
        console.error("[CAMPAIGNS_GET]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validated = campaignSchema.parse(body);

        await connectDB();

        const campaign = await Campaign.create({
            ...validated,
            workspaceId: session.user.workspaceId,
            status: "DRAFT",
            totalRecipients: 0, // In a real app, we'd fetch the count from the list
        });

        return NextResponse.json({ success: true, data: campaign });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
        }
        console.error("[CAMPAIGNS_POST]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
