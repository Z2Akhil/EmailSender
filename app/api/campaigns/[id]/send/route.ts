import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Campaign } from "@/models/Campaign";
import { Contact } from "@/models/Contact";
import { Workspace } from "@/models/Workspace";
import { Template } from "@/models/Template";
import { getWorkspaceSmtpConfig } from "@/lib/workspace-smtp";
import { addEmailJob, addWhatsappJob } from "@/lib/queue";
import { checkPlanLimits } from "@/lib/stripe";
import { strictRateLimit } from "@/lib/ratelimit";

export async function POST(
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

        // Strict Rate Limiting for sending
        const { success } = await strictRateLimit.limit(session.user.workspaceId);
        if (!success) {
            return NextResponse.json({ success: false, error: "Too many send attempts. Please wait a minute." }, { status: 429 });
        }

        // 1. Fetch Campaign
        const campaign = await Campaign.findOne({
            _id: id,
            workspaceId: session.user.workspaceId,
        });

        if (!campaign) {
            return NextResponse.json({ success: false, error: "Campaign not found" }, { status: 404 });
        }

        if (campaign.status !== "DRAFT") {
            return NextResponse.json({ success: false, error: "Campaign already sent or scheduled" }, { status: 400 });
        }

        if (!campaign.recipientListId) {
            return NextResponse.json({ success: false, error: "Recipient list not selected" }, { status: 400 });
        }

        const isWhatsapp = campaign.channel === "WHATSAPP";

        // 2. Fetch Recipients (ACTIVE contacts only — suppresses UNSUBSCRIBED and BOUNCED)
        const contacts = await Contact.find({
            listId: campaign.recipientListId,
            status: "ACTIVE",
        });

        if (contacts.length === 0) {
            return NextResponse.json({ success: false, error: "No active contacts in the selected list" }, { status: 400 });
        }

        // For WhatsApp campaigns, ensure contacts have a WhatsApp number and have opted in
        if (isWhatsapp) {
            // Fail fast on configuration problems instead of enqueueing jobs
            // that will all fail inside the worker
            const workspace = await Workspace.findById(session.user.workspaceId);
            if (!workspace?.whatsappAccessToken || !workspace?.whatsappPhoneNumberId) {
                return NextResponse.json({
                    success: false,
                    error: "WhatsApp is not connected. Configure it in Settings → WhatsApp first.",
                }, { status: 400 });
            }

            if (!campaign.templateId) {
                return NextResponse.json({
                    success: false,
                    error: "This campaign has no WhatsApp template selected.",
                }, { status: 400 });
            }

            const template = await Template.findById(campaign.templateId);
            if (!template || template.type !== "WHATSAPP" || !template.whatsappTemplateName) {
                return NextResponse.json({
                    success: false,
                    error: "The selected template is not a valid WhatsApp template. Re-sync templates and pick one.",
                }, { status: 400 });
            }

            const whatsappContacts = contacts.filter(
                (c) => c.whatsappNumber && c.whatsappOptIn
            );

            if (whatsappContacts.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: "No contacts in this list have a WhatsApp number with opt-in. Please ensure contacts have a whatsappNumber and whatsappOptIn=true.",
                }, { status: 400 });
            }

            // Update Campaign Status
            campaign.status = "SENDING";
            campaign.totalRecipients = whatsappContacts.length;
            campaign.sentAt = new Date();
            await campaign.save();

            // Dispatch WhatsApp jobs
            const jobPromises = whatsappContacts.map((contact) =>
                addWhatsappJob({
                    campaignId: campaign._id.toString(),
                    contactId: contact._id.toString(),
                    recipientPhone: contact.whatsappNumber!,
                    recipientName: contact.firstName,
                })
            );

            await Promise.all(jobPromises);

            return NextResponse.json({
                success: true,
                message: `Dispatched ${whatsappContacts.length} WhatsApp messages to queue`,
                totalRecipients: whatsappContacts.length,
            });
        }

        // --- Email Campaign ---

        // Contacts imported for WhatsApp only have no email address.
        const emailContacts = contacts.filter((c) => c.email);
        if (emailContacts.length === 0) {
            return NextResponse.json({
                success: false,
                error: "No contacts in this list have an email address. Import contacts with an Email column, or switch this campaign to WhatsApp.",
            }, { status: 400 });
        }

        // Fail fast on configuration instead of enqueueing jobs that all fail
        // one by one inside the worker.
        if (!(await getWorkspaceSmtpConfig(session.user.workspaceId))) {
            return NextResponse.json({
                success: false,
                error: "No SMTP server is configured. Connect your email account in Settings → SMTP first.",
            }, { status: 400 });
        }

        // Check Plan Limits (Email Volume)
        const limitCheck = await checkPlanLimits(session.user.workspaceId, "emails");
        if (!limitCheck.allowed) {
            return NextResponse.json({
                success: false,
                error: `Monthly email limit reached. You have sent ${limitCheck.current} emails and your limit is ${limitCheck.limit}. Please upgrade your plan.`,
                code: "LIMIT_REACHED"
            }, { status: 403 });
        }

        // 3. Update Campaign Status
        campaign.status = "SENDING";
        campaign.totalRecipients = emailContacts.length;
        campaign.sentAt = new Date();
        await campaign.save();

        // 4. Dispatch Email Jobs
        const jobPromises = emailContacts.map((contact) =>
            addEmailJob({
                campaignId: campaign._id.toString(),
                contactId: contact._id.toString(),
                recipientEmail: contact.email!,
                recipientName: contact.firstName,
                recipientLastName: contact.lastName,
            })
        );

        await Promise.all(jobPromises);

        return NextResponse.json({
            success: true,
            message: `Dispatched ${emailContacts.length} emails to queue`,
            totalRecipients: emailContacts.length
        });
    } catch (error) {
        console.error("[CAMPAIGN_SEND]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
