import mongoose, { Document, Model, Schema } from "mongoose";

export interface IMetaAssetCache extends Document {
    workspaceId: mongoose.Types.ObjectId;
    accessToken: string; // Encrypted long-lived token
    businesses: {
        id: string;
        name: string;
    }[];
    wabas: {
        id: string;
        name: string;
        businessId: string;
    }[];
    phoneNumbers: {
        id: string;
        displayNumber: string;
        wabaId: string;
    }[];
    expiresAt: Date;
}

const MetaAssetCacheSchema = new Schema<IMetaAssetCache>(
    {
        workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, unique: true },
        accessToken: { type: String, required: true },
        businesses: [{
            id: { type: String, required: true },
            name: { type: String, required: true }
        }],
        wabas: [{
            id: { type: String, required: true },
            name: { type: String, required: true },
            businessId: { type: String, required: true }
        }],
        phoneNumbers: [{
            id: { type: String, required: true },
            displayNumber: { type: String, required: true },
            wabaId: { type: String, required: true }
        }],
        expiresAt: { type: Date, required: true, index: { expires: 0 } } // Auto-delete documents when expiresAt is reached
    },
    { timestamps: true }
);

export const MetaAssetCache: Model<IMetaAssetCache> =
    mongoose.models.MetaAssetCache ||
    mongoose.model<IMetaAssetCache>("MetaAssetCache", MetaAssetCacheSchema);
