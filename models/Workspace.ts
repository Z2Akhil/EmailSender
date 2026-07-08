import mongoose, { Document, Model, Schema } from "mongoose";

export interface IWorkspace extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    ownerId: mongoose.Types.ObjectId;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    stripePriceId?: string;
    subscriptionStatus?: "active" | "trialing" | "past_due" | "canceled" | "unpaid" | "incomplete";
    planTier: "FREE" | "STARTER" | "PRO";
    // SMTP Configuration
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    smtpSecure?: boolean;
    // WhatsApp Configuration
    whatsappAccessToken?: string;
    whatsappPhoneNumberId?: string;
    whatsappBusinessAccountId?: string;
    // Onboarding
    onboardingCompletedAt?: Date;
    onboardingSkipped?: boolean;
    checklistDismissedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface IWorkspaceMember extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    role: "OWNER" | "ADMIN" | "MEMBER";
    joinedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>(
    {
        name: { type: String, required: true, trim: true },
        ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        stripeCustomerId: { type: String },
        stripeSubscriptionId: { type: String },
        stripePriceId: { type: String },
        subscriptionStatus: {
            type: String,
            enum: ["active", "trialing", "past_due", "canceled", "unpaid", "incomplete"],
        },
        planTier: {
            type: String,
            enum: ["FREE", "STARTER", "PRO"],
            default: "FREE",
        },
        // SMTP Config
        smtpHost: { type: String, trim: true },
        smtpPort: { type: Number },
        smtpUser: { type: String, trim: true },
        smtpPass: { type: String }, // Should be encrypted in production
        smtpSecure: { type: Boolean, default: true },
        // WhatsApp Config
        whatsappAccessToken: { type: String }, // Should be encrypted
        whatsappPhoneNumberId: { type: String },
        whatsappBusinessAccountId: { type: String },
        // Onboarding: set on wizard finish or skip; undefined on legacy
        // workspaces (handled by an activity check, never a migration)
        onboardingCompletedAt: { type: Date },
        onboardingSkipped: { type: Boolean },
        checklistDismissedAt: { type: Date },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

const WorkspaceMemberSchema = new Schema<IWorkspaceMember>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
        role: {
            type: String,
            enum: ["OWNER", "ADMIN", "MEMBER"],
            default: "MEMBER",
        },
        joinedAt: { type: Date, default: Date.now },
    },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

WorkspaceMemberSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });

export const Workspace: Model<IWorkspace> =
    mongoose.models.Workspace ||
    mongoose.model<IWorkspace>("Workspace", WorkspaceSchema);

export const WorkspaceMember: Model<IWorkspaceMember> =
    mongoose.models.WorkspaceMember ||
    mongoose.model<IWorkspaceMember>("WorkspaceMember", WorkspaceMemberSchema);
