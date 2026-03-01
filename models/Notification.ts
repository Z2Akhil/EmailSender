import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
    userId?: mongoose.Types.ObjectId; // Optional: If null, it's a broadcast to all users
    title: string;
    message: string;
    type: "info" | "warning" | "success" | "alert";
    isRead: boolean;
    createdAt: Date;
}

const NotificationSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: false, // If not provided, it's a global notification
        },
        title: {
            type: String,
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["info", "warning", "success", "alert"],
            default: "info",
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Prevent redefining the model if it already exists
const Notification =
    mongoose.models.Notification ||
    mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
