import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function requireAuth() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session?.user?.workspaceId) {
        return {
            session: null,
            response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
        };
    }

    return { session, response: null };
}
