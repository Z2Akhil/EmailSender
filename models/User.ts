import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    email: string;
    password?: string;
    image?: string;
    emailVerified?: Date;
    // Mirror of the owner workspace's planTier (source of truth for
    // entitlements is Workspace.planTier — synced by the Stripe webhook
    // and the admin change_plan action)
    plan: "FREE" | "STARTER" | "PRO";
    providers: ("credentials" | "google")[];
    isProfileComplete: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, select: false },
        image: { type: String },
        emailVerified: { type: Date },
        plan: {
            type: String,
            enum: ["FREE", "STARTER", "PRO"],
            default: "FREE",
        },
        providers: {
            type: [String],
            enum: ["credentials", "google"],
            default: [],
        },
        isProfileComplete: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Hash password before saving (Mongoose 7+ async pre hook without next)
UserSchema.pre("save", async function () {
    if (!this.isModified("password") || !this.password) return;
    this.password = await bcrypt.hash(this.password as string, 12);
});

UserSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

export const User: Model<IUser> =
    mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
