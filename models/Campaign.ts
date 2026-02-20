import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICampaign extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    subject: string;
    htmlContent: string;
    textContent?: string;
    fromName: string;
    fromEmail: string;
    replyTo?: string;
    status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "CANCELLED";
    scheduledAt?: Date;
    sentAt?: Date;
    workspaceId: mongoose.Types.ObjectId;
    domainId?: mongoose.Types.ObjectId;
    templateId?: mongoose.Types.ObjectId;
    recipientListId?: mongoose.Types.ObjectId;
    totalRecipients: number;
    sentCount: number;
    openCount: number;
    clickCount: number;
    bounceCount: number;
    unsubscribeCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICampaignRecipient extends Document {
    _id: mongoose.Types.ObjectId;
    campaignId: mongoose.Types.ObjectId;
    contactId: mongoose.Types.ObjectId;
    email: string;
    status: "PENDING" | "DELIVERED" | "OPENED" | "CLICKED" | "BOUNCED" | "UNSUBSCRIBED" | "FAILED";
    openedAt?: Date;
    clickedAt?: Date;
    bouncedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
    {
        name: { type: String, required: true, trim: true },
        subject: { type: String, required: true, trim: true },
        htmlContent: { type: String, required: true },
        textContent: { type: String },
        fromName: { type: String, required: true, trim: true },
        fromEmail: { type: String, required: true, lowercase: true, trim: true },
        replyTo: { type: String, lowercase: true, trim: true },
        status: {
            type: String,
            enum: ["DRAFT", "SCHEDULED", "SENDING", "SENT", "CANCELLED"],
            default: "DRAFT",
        },
        scheduledAt: { type: Date },
        sentAt: { type: Date },
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
        domainId: { type: Schema.Types.ObjectId, ref: "Domain" },
        templateId: { type: Schema.Types.ObjectId, ref: "Template" },
        recipientListId: { type: Schema.Types.ObjectId, ref: "ContactList" },
        totalRecipients: { type: Number, default: 0 },
        sentCount: { type: Number, default: 0 },
        openCount: { type: Number, default: 0 },
        clickCount: { type: Number, default: 0 },
        bounceCount: { type: Number, default: 0 },
        unsubscribeCount: { type: Number, default: 0 },
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
CampaignSchema.index({ domainId: 1 });

const CampaignRecipientSchema = new Schema<ICampaignRecipient>(
    {
        campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", required: true },
        contactId: { type: Schema.Types.ObjectId, ref: "Contact", required: true },
        email: { type: String, required: true, lowercase: true },
        status: {
            type: String,
            enum: ["PENDING", "DELIVERED", "OPENED", "CLICKED", "BOUNCED", "UNSUBSCRIBED", "FAILED"],
            default: "PENDING",
        },
        openedAt: { type: Date },
        clickedAt: { type: Date },
        bouncedAt: { type: Date },
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
