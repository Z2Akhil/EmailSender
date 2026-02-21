// ─── User & Auth Types ────────────────────────────────────────────────────────

export type UserPlan = "FREE" | "STARTER" | "GROWTH" | "PRO";

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";

// ─── Contact Types ────────────────────────────────────────────────────────────

export type ContactStatus = "ACTIVE" | "UNSUBSCRIBED" | "BOUNCED";

export interface Contact {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    company?: string | null;
    phone?: string | null;
    listId: string;
    status: ContactStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface ContactList {
    id: string;
    _id?: string;
    name: string;
    workspaceId: string;
    contactCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface Domain {
    id: string;
    _id?: string;
    domainName: string;
    workspaceId: string;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
    verificationToken?: string;
    dkimTokens?: string[];
    createdAt: string;
    updatedAt: string;
}

// ─── Campaign Types ───────────────────────────────────────────────────────────

export type CampaignStatus = "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "CANCELLED";

export type RecipientStatus =
    | "PENDING"
    | "DELIVERED"
    | "OPENED"
    | "CLICKED"
    | "BOUNCED"
    | "UNSUBSCRIBED"
    | "FAILED";

export interface Campaign {
    id: string;
    name: string;
    subject: string;
    htmlContent: string;
    textContent?: string | null;
    fromName: string;
    fromEmail: string;
    replyTo?: string | null;
    status: CampaignStatus;
    scheduledAt?: Date | null;
    sentAt?: Date | null;
    workspaceId: string;
    provider?: "SES" | "SMTP";
    domainId?: string | null;
    templateId?: string | null;
    recipientListId?: string | null;
    totalRecipients: number;
    sentCount: number;
    openCount: number;
    clickCount: number;
    bounceCount: number;
    unsubscribeCount: number;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Template Types ───────────────────────────────────────────────────────────

export interface Template {
    id: string;
    name: string;
    description?: string | null;
    htmlContent: string;
    thumbnail?: string | null;
    workspaceId?: string | null;
    isGlobal: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface DashboardStats {
    totalContacts: number;
    totalCampaigns: number;
    emailsSentThisMonth: number;
    avgOpenRate: number;
    avgClickRate: number;
    recentCampaigns: Campaign[];
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

// ─── NextAuth Session Extension ───────────────────────────────────────────────

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            image?: string | null;
            plan: string;
            workspaceId: string;
        };
    }
}

export interface SMTPConfig {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass?: string;
    smtpSecure: boolean;
}
