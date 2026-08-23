import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Workspace } from "@/models/Workspace";
import { encrypt } from "@/lib/crypto";
import { z } from "zod";

// The token is optional on update: an already-connected workspace can change
// the phone / business ids while keeping the stored token.
const schema = z.object({
    whatsappAccessToken: z.string().optional(),
    whatsappPhoneNumberId: z.string().min(1, "Phone Number ID is required"),
    whatsappBusinessAccountId: z.string().min(1, "Business Account ID is required"),
});

// Lightweight status check used by the campaign form to warn early
// when a WhatsApp campaign is being built without a connected account
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const workspace = await Workspace.findById(session.user.workspaceId)
            .select("whatsappAccessToken whatsappPhoneNumberId whatsappBusinessAccountId");

        return NextResponse.json({
            configured: !!(workspace?.whatsappAccessToken && workspace?.whatsappPhoneNumberId),
            phoneNumberId: workspace?.whatsappPhoneNumberId || null,
            businessAccountId: workspace?.whatsappBusinessAccountId || null,
        });
    } catch (error) {
        console.error("WhatsApp status error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * DELETE /api/whatsapp/auth
 * Disconnects the Meta account: drops the access token and the phone/WABA ids
 * from the workspace. Synced templates are left alone — reconnecting the same
 * account makes them usable again; a different account should re-sync.
 * WhatsApp campaigns stop sending immediately (the worker checks the token).
 */
export async function DELETE() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const workspace = await Workspace.findByIdAndUpdate(
            session.user.workspaceId,
            { $unset: { whatsappAccessToken: "", whatsappPhoneNumberId: "", whatsappBusinessAccountId: "" } },
            { new: true }
        );

        if (!workspace) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "WhatsApp account disconnected" });
    } catch (error) {
        console.error("WhatsApp disconnect error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { whatsappAccessToken, whatsappPhoneNumberId, whatsappBusinessAccountId } = schema.parse(body);

        await connectDB();

        const workspaceId = session.user.workspaceId;
        if (!workspaceId) {
            return NextResponse.json({ error: "No workspace found" }, { status: 400 });
        }

        const update: Record<string, string> = {
            whatsappPhoneNumberId,
            whatsappBusinessAccountId,
        };

        if (whatsappAccessToken?.trim()) {
            update.whatsappAccessToken = encrypt(whatsappAccessToken.trim());
        } else {
            // Blank means "keep the current token" — only valid if one exists.
            const existing = await Workspace.findById(workspaceId).select("whatsappAccessToken");
            if (!existing?.whatsappAccessToken) {
                return NextResponse.json({ error: "Access Token is required" }, { status: 400 });
            }
        }

        await Workspace.findByIdAndUpdate(workspaceId, update);

        return NextResponse.json({ message: "WhatsApp credentials saved successfully" }, { status: 200 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("WhatsApp auth error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
