import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Template } from "@/models/Template";
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

const OFFICIAL_TEMPLATES = [
    {
        name: "Welcome Email",
        description: "A friendly welcome message for new subscribers",
        htmlContent: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h1 style="color: #2563eb;">Welcome to our community!</h1>
                <p>Hi there,</p>
                <p>We're absolutely thrilled to have you join us. Here's a little something to get you started...</p>
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">What to expect:</h3>
                    <ul>
                        <li>Weekly tips and tricks</li>
                        <li>Exclusive early access to new features</li>
                        <li>Special discounts for members only</li>
                    </ul>
                </div>
                <p>If you have any questions, just hit reply!</p>
                <p>Cheers,<br>The Team</p>
            </div>
        `,
        isGlobal: true,
        category: "official"
    },
    {
        name: "Monthly Newsletter",
        description: "A clean and modern layout for your monthly updates",
        htmlContent: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee;">
                <div style="background: #1e293b; color: white; padding: 40px 20px; text-align: center;">
                    <h1 style="margin: 0;">Monthly Digest</h1>
                    <p style="opacity: 0.8;">Edition #42 • March 2026</p>
                </div>
                <div style="padding: 20px;">
                    <h2 style="color: #334155;">Featured Story</h2>
                    <img src="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=60" alt="Meeting" style="width: 100%; border-radius: 8px; margin-bottom: 20px;">
                    <p>This month we've focused on improving our user experience and adding more powerful tools for your business. Read all about it on our blog.</p>
                    <a href="#" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Read More</a>
                </div>
                <div style="background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px;">
                    <p>© 2026 BulkMailer Inc. All rights reserved.</p>
                </div>
            </div>
        `,
        isGlobal: true,
        category: "newsletter"
    },
    {
        name: "Seasonal Promotion",
        description: "Drive sales with this high-conversion offer template",
        htmlContent: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; text-align: center; padding: 40px 20px; border: 1px solid #eee; border-radius: 15px;">
                <span style="text-transform: uppercase; letter-spacing: 2px; color: #ef4444; font-weight: bold; font-size: 14px;">Limited Time Offer</span>
                <h1 style="font-size: 48px; margin: 10px 0; color: #1e293b;">50% OFF</h1>
                <p style="font-size: 18px; color: #64748b; margin-bottom: 30px;">Our biggest sale of the season is finally here. Use the code below at checkout.</p>
                <div style="background: #fef2f2; border: 2px dashed #fecaca; padding: 20px; font-size: 32px; font-weight: bold; color: #ef4444; display: inline-block; margin-bottom: 30px;">
                    FLASH50
                </div>
                <div>
                    <a href="#" style="display: inline-block; background: #ef4444; color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 18px; box-shadow: 0 4px 6px -1px rgba(239, 68, 68, 0.4);">Shop Now</a>
                </div>
            </div>
        `,
        isGlobal: true,
        category: "promotion"
    }
];

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // Check if we need to seed
        const count = await Template.countDocuments({ isGlobal: true });
        if (count === 0) {
            await Template.insertMany(OFFICIAL_TEMPLATES);
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
