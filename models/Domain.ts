import mongoose, { Schema, Document } from 'mongoose';

export interface IDomain extends Document {
    domainName: string;
    workspaceId: mongoose.Types.ObjectId;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
    verificationToken?: string;
    dkimTokens?: string[];
    spfRecord?: string;
    createdAt: Date;
    updatedAt: Date;
}

const DomainSchema: Schema = new Schema(
    {
        domainName: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: 'Workspace',
            required: true,
        },
        verificationStatus: {
            type: String,
            enum: ['PENDING', 'VERIFIED', 'FAILED'],
            default: 'PENDING',
        },
        verificationToken: {
            type: String,
        },
        dkimTokens: {
            type: [String],
        },
        spfRecord: {
            type: String,
        },
    },
    { timestamps: true }
);

// Index to ensure domain names are unique per workspace if needed, 
// but industry standard is unique across platform if using same SES account.
// Domain names must be unique globally in SES identities anyway.
DomainSchema.index({ domainName: 1 }, { unique: true });
DomainSchema.index({ workspaceId: 1 });

export default mongoose.models.Domain || mongoose.model<IDomain>('Domain', DomainSchema);
