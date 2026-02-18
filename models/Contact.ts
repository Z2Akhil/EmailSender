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
    email: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    phone?: string;
    listId: mongoose.Types.ObjectId;
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
    { timestamps: true }
);

const ContactSchema = new Schema<IContact>(
    {
        email: { type: String, required: true, lowercase: true, trim: true },
        firstName: { type: String, trim: true },
        lastName: { type: String, trim: true },
        company: { type: String, trim: true },
        phone: { type: String, trim: true },
        listId: { type: Schema.Types.ObjectId, ref: "ContactList", required: true },
        status: {
            type: String,
            enum: ["ACTIVE", "UNSUBSCRIBED", "BOUNCED"],
            default: "ACTIVE",
        },
    },
    { timestamps: true }
);

// Unique email per list
ContactSchema.index({ email: 1, listId: 1 }, { unique: true });
ContactSchema.index({ listId: 1, status: 1 });

export const ContactList: Model<IContactList> =
    mongoose.models.ContactList ||
    mongoose.model<IContactList>("ContactList", ContactListSchema);

export const Contact: Model<IContact> =
    mongoose.models.Contact ||
    mongoose.model<IContact>("Contact", ContactSchema);
