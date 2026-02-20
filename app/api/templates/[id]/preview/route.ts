import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Template } from "@/models/Template";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { id } = await params;

        await connectDB();

        const template = await Template.findOne({
            _id: id,
            $or: [
                { isGlobal: true },
                { workspaceId: session.user.workspaceId }
            ]
        });

        if (!template) {
            return new NextResponse("Template not found", { status: 404 });
        }

        // Return the HTML content directly for iframe/new tab preview
        return new NextResponse(template.htmlContent, {
            headers: {
                "Content-Type": "text/html",
                "Cache-Control": "public, max-age=3600"
            }
        });
    } catch (error) {
        console.error("[TEMPLATE_PREVIEW_GET]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
