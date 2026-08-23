// ─── User & Auth Types ────────────────────────────────────────────────────────

export type UserPlan = "FREE" | "STARTER" | "PRO";

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";

// ─── Contact Types ────────────────────────────────────────────────────────────

export type ContactStatus = "ACTIVE" | "UNSUBSCRIBED" | "BOUNCED";

export interface Contact {
    id: string;
    /** Absent on WhatsApp-only contacts — a contact needs email OR whatsappNumber. */
    email?: string | null;
    /** Split halves of the full name — `{{firstName}}` personalization reads them. */
    firstName?: string | null;
    lastName?: string | null;
    /** `firstName` + `lastName`, as entered. */
    fullName?: string | null;
    phone?: string | null;
    whatsappNumber?: string | null;
    whatsappOptIn?: boolean;
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
    emailDesign?: any; // Stores Unlayer JSON
    textContent?: string | null;
    fromName: string;
    fromEmail: string;
    replyTo?: string | null;
    status: CampaignStatus;
    scheduledAt?: Date | null;
    sentAt?: Date | null;
    workspaceId: string;
    channel?: "EMAIL" | "WHATSAPP";
    provider?: "SES" | "SMTP" | "SHARED";
    domainId?: string | null;
    templateId?: string | null;
    recipientListId?: string | null;
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

// ─── Template Types ───────────────────────────────────────────────────────────

export interface Template {
    id: string;
    name: string;
    description?: string | null;
    htmlContent?: string;
    emailDesign?: any; // Stores Unlayer JSON
    thumbnail?: string | null;
    category?: string | null;
    defaultSubject?: string | null;
    workspaceId?: string | null;
    isGlobal: boolean;
    type?: "EMAIL" | "WHATSAPP";
    whatsappTemplateName?: string | null;
    whatsappTemplateLanguage?: string | null;
    whatsappTemplateComponents?: any;
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



export interface SMTPConfig {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass?: string;
    smtpSecure: boolean;
}
