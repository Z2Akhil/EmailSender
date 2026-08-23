import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICampaign extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    subject: string;
    htmlContent: string;
    emailDesign?: any;
    textContent?: string;
    fromName: string;
    fromEmail: string;
    replyTo?: string;
    status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "CANCELLED";
    scheduledAt?: Date;
    sentAt?: Date;
    workspaceId: mongoose.Types.ObjectId;
    channel: "EMAIL" | "WHATSAPP";
    provider?: "SMTP" | "WHATSAPP";
    templateId?: mongoose.Types.ObjectId;
    recipientListId?: mongoose.Types.ObjectId;
    totalRecipients: number;
    sentCount: number;
    openCount: number;
    clickCount: number;
    bounceCount: number;
    unsubscribeCount: number;
    failedCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICampaignRecipient extends Document {
    _id: mongoose.Types.ObjectId;
    campaignId: mongoose.Types.ObjectId;
    contactId: mongoose.Types.ObjectId;
    email: string;
    messageId?: string;
    status: "PENDING" | "DELIVERED" | "OPENED" | "CLICKED" | "BOUNCED" | "UNSUBSCRIBED" | "FAILED" | "READ" | "SENT";
    openedAt?: Date;
    clickedAt?: Date;
    bouncedAt?: Date;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
    {
        name: { type: String, required: true, trim: true },
        subject: { type: String, trim: true }, // Optional for WhatsApp
        htmlContent: { type: String }, // Optional for WhatsApp
        emailDesign: { type: Schema.Types.Mixed }, // Stores Unlayer JSON
        textContent: { type: String },
        // Sender identity only applies to email campaigns
        fromName: {
            type: String,
            trim: true,
            required: function (this: ICampaign) { return this.channel === "EMAIL"; },
        },
        fromEmail: {
            type: String,
            lowercase: true,
            trim: true,
            required: function (this: ICampaign) { return this.channel === "EMAIL"; },
        },
        replyTo: { type: String, lowercase: true, trim: true },
        status: {
            type: String,
            enum: ["DRAFT", "SCHEDULED", "SENDING", "SENT", "CANCELLED"],
            default: "DRAFT",
        },
        scheduledAt: { type: Date },
        sentAt: { type: Date },
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
        channel: { type: String, enum: ["EMAIL", "WHATSAPP"], default: "EMAIL" },
        provider: { type: String, enum: ["SMTP", "WHATSAPP"], default: "SMTP" },
        templateId: { type: Schema.Types.ObjectId, ref: "Template" },
        recipientListId: { type: Schema.Types.ObjectId, ref: "ContactList" },
        totalRecipients: { type: Number, default: 0 },
        sentCount: { type: Number, default: 0 },
        openCount: { type: Number, default: 0 },
        clickCount: { type: Number, default: 0 },
        bounceCount: { type: Number, default: 0 },
        unsubscribeCount: { type: Number, default: 0 },
        failedCount: { type: Number, default: 0 },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

CampaignSchema.index({ workspaceId: 1, status: 1 });
CampaignSchema.index({ workspaceId: 1, createdAt: -1 });
CampaignSchema.index({ workspaceId: 1, recipientListId: 1 });

const CampaignRecipientSchema = new Schema<ICampaignRecipient>(
    {
        campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
        contactId: { type: Schema.Types.ObjectId, ref: "Contact", required: true },
        email: { type: String, required: true, lowercase: true },
        messageId: { type: String },
        status: {
            type: String,
            enum: ["PENDING", "DELIVERED", "OPENED", "CLICKED", "BOUNCED", "UNSUBSCRIBED", "FAILED", "READ", "SENT"],
            default: "PENDING",
        },
        openedAt: { type: Date },
        clickedAt: { type: Date },
        bouncedAt: { type: Date },
        errorMessage: { type: String },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

CampaignRecipientSchema.index({ campaignId: 1, contactId: 1 }, { unique: true });
CampaignRecipientSchema.index({ campaignId: 1, status: 1 });

export const Campaign: Model<ICampaign> =
    mongoose.models.Campaign ||
    mongoose.model<ICampaign>("Campaign", CampaignSchema);

export const CampaignRecipient: Model<ICampaignRecipient> =
    mongoose.models.CampaignRecipient ||
    mongoose.model<ICampaignRecipient>("CampaignRecipient", CampaignRecipientSchema);
