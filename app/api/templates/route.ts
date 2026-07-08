import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Template } from "@/models/Template";
import { GALLERY_TEMPLATES, toTemplateDoc } from "@/lib/gallery-templates";
import { z } from "zod";

const templateSchema = z.object({
    name: z.string().min(1, "Template name is required"),
    description: z.string().optional(),
    htmlContent: z.string().min(1, "Content is required"),
    // Editor design JSON ({ editor: "tiptap", content }) — without it a saved
    // template can never be re-edited
    emailDesign: z.any().optional(),
    textContent: z.string().optional(),
    thumbnail: z.string().optional(),
});


export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Lazy-seed the gallery on first ever request (fresh installs);
        // the cron seeder is the force-reseed path
        const count = await Template.countDocuments({ isGlobal: true, type: "EMAIL" });
        if (count === 0) {
            await Template.insertMany(GALLERY_TEMPLATES.map(toTemplateDoc));
        }

        // Fetch global templates and templates belonging to this workspace
        const templates = await Template.find({
            $or: [
                { isGlobal: true },
                { workspaceId: session.user.workspaceId }
            ]
        })
            .select("-htmlContent -emailDesign")
            .sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: templates });
    } catch (error) {
        console.error("[TEMPLATES_GET]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const validated = templateSchema.parse(body);

        await connectDB();

        const template = await Template.create({
            ...validated,
            workspaceId: session.user.workspaceId,
            isGlobal: false,
        });

        return NextResponse.json({ success: true, data: template });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 });
        }
        console.error("[TEMPLATES_POST]", error);
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}
