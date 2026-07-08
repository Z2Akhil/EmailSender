import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Template } from "@/models/Template";
import { GALLERY_TEMPLATES, toTemplateDoc } from "@/lib/gallery-templates";

export const dynamic = "force-dynamic";

/**
 * POST /api/cron/seed-templates
 * Force-reseeds the global email template gallery from lib/gallery-templates.ts.
 * Deletes every global non-WhatsApp template first (wipes older broken seed
 * generations too), then inserts the current gallery. Idempotent.
 * Protected by CRON_SECRET env var.
 */
export async function POST(req: NextRequest) {
    // Fail closed if CRON_SECRET is not configured
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await connectDB();

        // Campaigns copy htmlContent at creation time, so deleting global
        // templates never breaks existing campaigns; the worker resolves
        // templateId only for WhatsApp sends (excluded here).
        const deleted = await Template.deleteMany({
            isGlobal: true,
            type: { $ne: "WHATSAPP" },
        });

        const created = await Template.insertMany(GALLERY_TEMPLATES.map(toTemplateDoc));

        return NextResponse.json({
            success: true,
            deleted: deleted.deletedCount,
            created: created.length,
        });
    } catch (error) {
        console.error("[SEED_TEMPLATES]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
