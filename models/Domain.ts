import mongoose, { Schema, Document } from 'mongoose';

export type AuthRecordStatus = 'PASS' | 'WARN' | 'FAIL' | 'UNCHECKED';

export interface IAuthRecord {
    status: AuthRecordStatus;
    value?: string;
    message?: string;
    fix?: string;
}

/**
 * A domain the workspace sends from. Nothing is provisioned for it — mail goes
 * out through the workspace's SMTP provider. This record caches the result of
 * the last SPF/DKIM/DMARC DNS check (lib/email-auth.ts) so the settings page
 * can render without re-resolving on every paint.
 */
export interface IDomain extends Document {
    domainName: string;
    workspaceId: mongoose.Types.ObjectId;
    /** PASS on all three checks = VERIFIED. */
    verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
    /** DKIM selector supplied by the user, when their provider uses a custom one. */
    dkimSelector?: string;
    spf?: IAuthRecord;
    dkim?: IAuthRecord;
    dmarc?: IAuthRecord;
    lastCheckedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AuthRecordSchema = new Schema<IAuthRecord>(
    {
        status: { type: String, enum: ['PASS', 'WARN', 'FAIL', 'UNCHECKED'], default: 'UNCHECKED' },
        value: { type: String },
        message: { type: String },
        fix: { type: String },
    },
    { _id: false }
);

const DomainSchema: Schema = new Schema(
    {
        domainName: {
            type: String,
            required: true,
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
        dkimSelector: { type: String, trim: true },
        spf: { type: AuthRecordSchema },
        dkim: { type: AuthRecordSchema },
        dmarc: { type: AuthRecordSchema },
        lastCheckedAt: { type: Date },
    },
    { timestamps: true }
);

// Scoped per workspace: two workspaces may legitimately check the same domain,
// since checking is a read-only DNS lookup and claims nothing.
//
// NOTE: this replaces a globally unique `domainName_1` index left over from the
// SES identity model. Run `npx tsx scripts/migrate-domain-indexes.ts` once
// against an existing database, or the second workspace to add a domain that
// another already tracks will fail to insert.
DomainSchema.index({ workspaceId: 1, domainName: 1 }, { unique: true });

export default mongoose.models.Domain || mongoose.model<IDomain>('Domain', DomainSchema);
