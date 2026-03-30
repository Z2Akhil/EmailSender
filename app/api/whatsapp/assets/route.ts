import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { MetaAssetCache } from "@/models/MetaAssetCache";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id || !session.user.workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const workspaceId = session.user.workspaceId;

        const cache = await MetaAssetCache.findOne({ workspaceId });

        if (!cache) {
            return NextResponse.json({ error: "No pending Meta Connect session found" }, { status: 404 });
        }

        // Return the asset tree but hide the token
        return NextResponse.json({
            businesses: cache.businesses,
            wabas: cache.wabas,
            phoneNumbers: cache.phoneNumbers,
            expiresAt: cache.expiresAt
        }, { status: 200 });

    } catch (error) {
        console.error("Fetch Meta assets error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
