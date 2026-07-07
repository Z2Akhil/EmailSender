import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { ContactList } from "@/models/Contact";
import { z } from "zod";

// Empty strings are allowed on channel-dependent fields: the campaign form
// always submits the full form state, and WhatsApp campaigns legitimately
// have no subject/fromEmail.
const campaignUpdateSchema = z.object({
    name: z.string().min(1).optional(),
    channel: z.enum(["EMAIL", "WHATSAPP"]).optional(),
    subject: z.string().optional(),
    fromName: z.string().optional(),
    fromEmail: z.string().email().optional().or(z.literal("")),
    replyTo: z.string().email().optional().or(z.literal("")),
    provider: z.enum(["SES", "SMTP", "WHATSAPP"]).optional(),
    templateId: z.string().optional(),
    htmlContent: z.string().optional(),
    emailDesign: z.any().optional(),
    textContent: z.string().optional(),
    recipientListId: z.string().optional(),
    domainId: z.string().optional().or(z.literal("")),
    status: z.enum(["DRAFT", "SCHEDULED", "SENDING", "SENT", "CANCELLED"]).optional(),
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

        // Handle empty string for domainId by unsetting it
        if (validated.domainId === "") {
            delete validated.domainId;
            // Explicitly unset it in DB if they are removing the domain
            (validated as any).$unset = { domainId: "" };
        }
        // Empty ObjectId strings would throw CastErrors on save
        if (validated.templateId === "") delete validated.templateId;
        if (validated.recipientListId === "") delete validated.recipientListId;

        // If recipient list changed, update the total recipients count
        if (validated.recipientListId) {
            const list = await ContactList.findById(validated.recipientListId);
            if (list) {
                (validated as any).totalRecipients = list.contactCount;
            }
        }

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
