"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Send, BellRing, ShieldAlert, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface LogEvent {
    id: number;
    event: string;
    user: string;
    time: string;
    type: string;
}

export default function AdminMonitorPage() {
    const [events, setEvents] = useState<LogEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // Notification form state
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState("info");
    const [sending, setSending] = useState(false);


    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await fetch("/api/admin/notifications");
                if (res.ok) {
                    const data = await res.json();
                    setEvents(data.activity || []);
                }
            } catch (error) {
                console.error("Failed to fetch logs", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !message) {
            toast.error("Title and message are required");
            return;
        }

        setSending(true);
        try {
            const res = await fetch("/api/admin/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    message,
                    type,
                    isGlobal: true, // Send to all users
                })
            });

            if (res.ok) {
                toast.success("Notification Sent", { description: "The broadcast was sent to all users successfully." });
                setTitle("");
                setMessage("");
                setType("info");
            } else {
                throw new Error("Failed to send");
            }
        } catch (error) {
            toast.error("Failed to Send", { description: "Could not broadcast the notification." });
        } finally {
            setSending(false);
        }
    };

    const getLogIcon = (type: string) => {
        switch (type) {
            case "error": return <ShieldAlert className="w-5 h-5 text-red-500" />;
            case "warning": return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            case "alert": return <BellRing className="w-5 h-5 text-purple-500" />;
            default: return <CheckCircle2 className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">System Monitor & Logs</h2>
                <p className="text-sm text-gray-500">Monitor app health and send global push notifications.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Push Notification Sender */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Send className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Broadcast Push Notification</h3>
                    </div>

                    <form onSubmit={handleSendNotification} className="space-y-4 flex-1">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alert Title</label>
                            <input
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Scheduled Maintenance"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                            <textarea
                                required
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Details about this announcement..."
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Severity Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="info">Information (Blue)</option>
                                <option value="success">Success (Green)</option>
                                <option value="warning">Warning (Orange)</option>
                                <option value="alert">Critical Alert (Red)</option>
                            </select>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={sending}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Broadcast to All Users
                            </button>
                        </div>
                    </form>
                </div>

                {/* System Activity Logs */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col h-[500px]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Recent Abuse & Errors</h3>
                        </div>
                        <span className="text-xs font-medium bg-red-50 text-red-600 px-2.5 py-1 rounded-full border border-red-100">Live</span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                            </div>
                        ) : events.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">No recent critical events recorded.</div>
                        ) : (
                            events.map((evt) => (
                                <div key={evt.id} className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors cursor-default">
                                    <div className="mt-0.5">
                                        {getLogIcon(evt.type)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{evt.event}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className="text-xs text-gray-500 font-mono">{evt.user}</p>
                                            <p className="text-xs text-gray-400">{new Date(evt.time).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
