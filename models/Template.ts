import mongoose, { Document, Model, Schema } from "mongoose";

export interface ITemplate extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    htmlContent: string;
    thumbnail?: string;
    workspaceId?: mongoose.Types.ObjectId;
    isGlobal: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TemplateSchema = new Schema<ITemplate>(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        htmlContent: { type: String, required: true },
        thumbnail: { type: String },
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace" },
        isGlobal: { type: Boolean, default: false },
    },
    { timestamps: true }
);

TemplateSchema.index({ workspaceId: 1 });
TemplateSchema.index({ isGlobal: 1 });

export const Template: Model<ITemplate> =
    mongoose.models.Template ||
    mongoose.model<ITemplate>("Template", TemplateSchema);
