import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITemplate extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    type: "EMAIL" | "WHATSAPP";
    htmlContent?: string;
    emailDesign?: any;
    textContent?: string;
    thumbnail?: string;
    category?: string;
    defaultSubject?: string;
    workspaceId?: mongoose.Types.ObjectId;
    isGlobal: boolean;
    whatsappTemplateName?: string;
    whatsappTemplateLanguage?: string;
    whatsappTemplateComponents?: any[];
    createdAt: Date;
    updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        type: { type: String, enum: ["EMAIL", "WHATSAPP"], default: "EMAIL" },
        htmlContent: { type: String }, // Optional for WhatsApp
        emailDesign: { type: Schema.Types.Mixed }, // Stores Unlayer JSON
        textContent: { type: String },
        thumbnail: { type: String },
        // Gallery metadata: use-case tag + suggested subject line
        category: { type: String, trim: true },
        defaultSubject: { type: String, trim: true },
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace" },
        isGlobal: { type: Boolean, default: false },
        whatsappTemplateName: { type: String },
        whatsappTemplateLanguage: { type: String },
        whatsappTemplateComponents: [{ type: Schema.Types.Mixed }],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

TemplateSchema.index({ workspaceId: 1 });
TemplateSchema.index({ isGlobal: 1 });

export const Template: Model<ITemplate> =
    mongoose.models.Template ||
    mongoose.model<ITemplate>("Template", TemplateSchema);
