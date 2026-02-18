import mongoose, { Document, Model, Schema } from "mongoose";

export interface IWorkspace extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    ownerId: mongoose.Types.ObjectId;
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
    },
    { timestamps: true }
);

const WorkspaceMemberSchema = new Schema<IWorkspaceMember>({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    role: {
        type: String,
        enum: ["OWNER", "ADMIN", "MEMBER"],
        default: "MEMBER",
    },
    joinedAt: { type: Date, default: Date.now },
});

WorkspaceMemberSchema.index({ userId: 1, workspaceId: 1 }, { unique: true });

export const Workspace: Model<IWorkspace> =
    mongoose.models.Workspace ||
    mongoose.model<IWorkspace>("Workspace", WorkspaceSchema);

export const WorkspaceMember: Model<IWorkspaceMember> =
    mongoose.models.WorkspaceMember ||
    mongoose.model<IWorkspaceMember>("WorkspaceMember", WorkspaceMemberSchema);
