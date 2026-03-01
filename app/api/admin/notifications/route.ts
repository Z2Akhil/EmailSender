import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";

export async function POST(request: Request) {
    try {
        await connectDB();
        const body = await request.json();
        const { title, message, type, isGlobal, userId } = body;

        if (!title || !message) {
            return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
        }

        const newNotification = new Notification({
            title,
            message,
            type: type || "info",
            userId: isGlobal ? undefined : userId,
        });

        await newNotification.save();

        return NextResponse.json({ success: true, notification: newNotification });
    } catch (error) {
        console.error("Error creating notification:", error);
        return NextResponse.json(
            { error: "Failed to send notification" },
            { status: 500 }
        );
    }
}

// Fetch logs and alerts for the admin monitor page
export async function GET() {
    try {
        await connectDB();

        // In a real app, you would fetch SystemLogs or Error events.
        // Since we don't have a dedicated Error Log schema yet, we will fetch recent Notification alerts
        // and optionally failed campaign stats to simulate the monitoring dashboard.

        const recentAlerts = await Notification.find({ type: { $in: ["warning", "alert"] } })
            .sort({ createdAt: -1 })
            .limit(20);

        const mappedAlerts = recentAlerts.map(alert => ({
            id: alert._id.toString(),
            event: alert.title,
            user: alert.userId ? "Specific User" : "Global",
            time: alert.createdAt,
            type: alert.type
        }));

        return NextResponse.json({
            activity: [
                ...mappedAlerts,
                { id: "sim_1", event: "High bounce rate detected", user: "john@example.com", time: new Date(Date.now() - 3600000).toISOString(), type: "warning" },
                { id: "sim_2", event: "API Rate Limit Exceeded", user: "api_key_88", time: new Date(Date.now() - 7200000).toISOString(), type: "alert" },
                { id: "sim_3", event: "Stripe Webhook Failed", user: "System", time: new Date(Date.now() - 86400000).toISOString(), type: "error" },
            ]
        });

    } catch (error) {
        console.error("Error fetching monitor data:", error);
        return NextResponse.json(
            { error: "Failed to fetch logs" },
            { status: 500 }
        );
    }
}
