import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Workspace } from "@/models/Workspace";
import { encrypt } from "@/lib/crypto";
import { z } from "zod";

const schema = z.object({
    whatsappAccessToken: z.string().min(1, "Access Token is required"),
    whatsappPhoneNumberId: z.string().min(1, "Phone Number ID is required"),
    whatsappBusinessAccountId: z.string().min(1, "Business Account ID is required"),
});

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

        // Encrypt the token before saving
        const encryptedToken = encrypt(whatsappAccessToken);

        await Workspace.findByIdAndUpdate(workspaceId, {
            whatsappAccessToken: encryptedToken,
            whatsappPhoneNumberId,
            whatsappBusinessAccountId,
        });

        return NextResponse.json({ message: "WhatsApp credentials saved successfully" }, { status: 200 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("WhatsApp auth error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
