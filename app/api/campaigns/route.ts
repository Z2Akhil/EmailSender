import { NextRequest, NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { ContactList } from "@/models/Contact";
import { z } from "zod";

const campaignSchema = z.object({
    name: z.string().min(1, "Campaign name is required"),
    channel: z.enum(["EMAIL", "WHATSAPP"]).optional().default("EMAIL"),
    subject: z.string().optional(),
    fromName: z.string().optional(),
    fromEmail: z.string().email("Invalid from email").optional().or(z.literal("")),
    replyTo: z.string().email("Invalid reply-to email").optional().or(z.literal("")),
    provider: z.enum(["SES", "SMTP", "WHATSAPP"]).optional().default("SES"),
    templateId: z.string().optional(),
    domainId: z.string().optional().or(z.literal("")),
    htmlContent: z.string().optional(),
    emailDesign: z.any().optional(),
    recipientListId: z.string().min(1, "Recipient list is required"),
}).superRefine((data, ctx) => {
    if (data.channel === "EMAIL") {
        if (!data.subject) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Subject is required", path: ["subject"] });
        if (!data.fromName) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "From name is required", path: ["fromName"] });
        if (!data.fromEmail) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "From email is required", path: ["fromEmail"] });
    }
    if (data.channel === "WHATSAPP" && !data.templateId) {
        // WhatsApp can only send pre-approved Meta templates — a campaign without one can never send
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "A WhatsApp template is required", path: ["templateId"] });
    }
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

        // Handle empty string for domainId by deleting it so Mongoose doesn't throw a CastError
        if (validated.domainId === "") {
            delete (validated as any).domainId;
        }
        if (validated.templateId === "") {
            delete (validated as any).templateId;
        }

        // WhatsApp campaigns always route via the WhatsApp provider
        if (validated.channel === "WHATSAPP") {
            validated.provider = "WHATSAPP";
        }

        // Fetch the list to get the actual contact count
        const list = await ContactList.findById(validated.recipientListId);

        const campaign = await Campaign.create({
            ...validated,
            workspaceId: session.user.workspaceId,
            status: "DRAFT",
            totalRecipients: list?.contactCount || 0,
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
