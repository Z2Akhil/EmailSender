import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Workspace } from "@/models/Workspace";
import { MetaAssetCache } from "@/models/MetaAssetCache";
import { z } from "zod";

const schema = z.object({
    businessId: z.string().min(1, "Business ID is required"),
    wabaId: z.string().min(1, "WhatsApp Business Account ID is required"),
    phoneNumberId: z.string().min(1, "Phone Number ID is required"),
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !session.user.workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { businessId, wabaId, phoneNumberId } = schema.parse(body);

        await connectDB();
        const workspaceId = session.user.workspaceId;

        // Find the pending session cache
        const cache = await MetaAssetCache.findOne({ workspaceId });
        if (!cache) {
            return NextResponse.json({ error: "OAuth session expired or not found. Please connect with Meta again." }, { status: 400 });
        }

        // Validate that the requested IDs actually exist in the cache to prevent tampering
        const validBusiness = cache.businesses.some(b => b.id === businessId);
        const validWaba = cache.wabas.some(w => w.id === wabaId && w.businessId === businessId);
        const validPhone = cache.phoneNumbers.some(p => p.id === phoneNumberId && p.wabaId === wabaId);

        if (!validBusiness || !validWaba || !validPhone) {
            return NextResponse.json({ error: "Invalid asset selection. Those assets do not belong to you or each other." }, { status: 400 });
        }

        // Save to workspace strictly bounded to the authenticated user's workspace
        await Workspace.findOneAndUpdate(
            { _id: workspaceId },
            {
                whatsappAccessToken: cache.accessToken, // Already encrypted in the cache
                whatsappBusinessAccountId: wabaId,
                whatsappPhoneNumberId: phoneNumberId,
            }
        );

        // Delete the cache now that it has been safely consumed
        await MetaAssetCache.deleteOne({ workspaceId });

        return NextResponse.json({ message: "WhatsApp assets connected successfully" }, { status: 200 });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("Select Meta asset error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
