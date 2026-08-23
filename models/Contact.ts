import mongoose, { Document, Model, Schema } from "mongoose";

export interface IContactList extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    workspaceId: mongoose.Types.ObjectId;
    contactCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IContact extends Document {
    _id: mongoose.Types.ObjectId;
    /**
     * Optional: a contact reachable only on WhatsApp has no email. Every email
     * send path must therefore filter on `email` being present.
     */
    email?: string;
    /** `fullName` split on the first space — `{{firstName}}` reads this. */
    firstName?: string;
    lastName?: string;
    phone?: string;
    whatsappNumber?: string;
    whatsappOptIn?: boolean;
    listId: mongoose.Types.ObjectId;
    workspaceId: mongoose.Types.ObjectId;
    status: "ACTIVE" | "UNSUBSCRIBED" | "BOUNCED";
    createdAt: Date;
    updatedAt: Date;
}

const ContactListSchema = new Schema<IContactList>(
    {
        name: { type: String, required: true, trim: true },
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
        contactCount: { type: Number, default: 0 },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

const ContactSchema = new Schema<IContact>(
    {
        email: { type: String, lowercase: true, trim: true },
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        phone: { type: String, trim: true },
        whatsappNumber: { type: String, trim: true },
        whatsappOptIn: { type: Boolean, default: false },
        listId: { type: Schema.Types.ObjectId, ref: "ContactList", required: true },
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
        status: {
            type: String,
            enum: ["ACTIVE", "UNSUBSCRIBED", "BOUNCED"],
            default: "ACTIVE",
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// A contact must be reachable on at least one channel, otherwise it can never
// be sent to and only inflates the plan's contact count.
ContactSchema.pre("validate", async function () {
    if (!this.email && !this.whatsappNumber) {
        throw new Error("A contact needs either an email or a WhatsApp number");
    }
});

// Unique per list on each identifier. Partial so that many email-less (or
// number-less) contacts can coexist — a plain unique index would collide on
// their missing values.
//
// NOTE: these replace the old `email_1_listId_1` index. Run
// `npx tsx scripts/migrate-contact-indexes.ts` once against an existing
// database, or inserts of email-less contacts will fail on the stale index.
ContactSchema.index(
    { listId: 1, email: 1 },
    { unique: true, partialFilterExpression: { email: { $type: "string" } } }
);
ContactSchema.index(
    { listId: 1, whatsappNumber: 1 },
    { unique: true, partialFilterExpression: { whatsappNumber: { $type: "string" } } }
);
ContactSchema.index({ listId: 1, status: 1 });
ContactSchema.index({ workspaceId: 1, status: 1 });
ContactSchema.index({ workspaceId: 1, email: 1 });

export const ContactList: Model<IContactList> =
    mongoose.models.ContactList ||
    mongoose.model<IContactList>("ContactList", ContactListSchema);

export const Contact: Model<IContact> =
    mongoose.models.Contact ||
    mongoose.model<IContact>("Contact", ContactSchema);
