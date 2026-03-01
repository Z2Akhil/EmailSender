import { NextResponse } from "next/server";
import { authorizeAdmin, createAdminToken, setAdminCookie } from "@/lib/admin-auth";

// POST /api/admin/auth
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        // 1. Verify credentials against .env
        const isValid = await authorizeAdmin(username, password);

        if (!isValid) {
            return NextResponse.json(
                { error: "Invalid admin credentials" },
                { status: 401 }
            );
        }

        // 2. Generate edge-compatible JWT
        const token = await createAdminToken();

        // 3. Set the token in an HTTP-Only secure cookie
        await setAdminCookie(token);

        return NextResponse.json({ success: true, message: "Admin authenticated successfully" });

    } catch (error) {
        console.error("Admin Authentication Error:", error);
        return NextResponse.json(
            { error: "An error occurred during authentication" },
            { status: 500 }
        );
    }
}
