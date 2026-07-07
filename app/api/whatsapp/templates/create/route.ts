import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Workspace } from "@/models/Workspace";
import { decrypt } from "@/lib/crypto";
import { z } from "zod";

const buttonSchema = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("QUICK_REPLY"),
        text: z.string().min(1).max(25),
    }),
    z.object({
        type: z.literal("URL"),
        text: z.string().min(1).max(25),
        url: z.string().url().max(2000),
    }),
    z.object({
        type: z.literal("PHONE_NUMBER"),
        text: z.string().min(1).max(25),
        phone_number: z.string().min(5).max(20),
    }),
]);

const createTemplateSchema = z.object({
    name: z.string()
        .min(1, "Template name is required")
        .max(512)
        .regex(/^[a-z0-9_]+$/, "Name must be lowercase letters, numbers and underscores only"),
    category: z.enum(["MARKETING", "UTILITY"]),
    language: z.string().min(2).max(10),
    headerText: z.string().max(60).optional(),
    bodyText: z.string().min(1, "Message body is required").max(1024),
    footerText: z.string().max(60).optional(),
    buttons: z.array(buttonSchema).max(3).optional(),
    // Example values for {{n}} placeholders, in order — Meta requires them for review
    bodyExamples: z.array(z.string().min(1)).optional(),
    headerExample: z.string().optional(),
});

const countPlaceholders = (text: string) => {
    const matches = text.match(/\{\{\s*(\d+)\s*\}\}/g) || [];
    return matches.reduce((max, m) => Math.max(max, parseInt(m.replace(/\D/g, ""), 10) || 0), 0);
};

/**
 * POST /api/whatsapp/templates/create
 * Creates a message template in the workspace's WhatsApp Business Account via
 * the Meta Graph API. Meta reviews templates (usually minutes to 24h); only
 * APPROVED templates appear after a sync and can be sent.
 */
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.workspaceId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const data = createTemplateSchema.parse(body);

        await connectDB();
        const workspace = await Workspace.findById(session.user.workspaceId);
        if (!workspace?.whatsappAccessToken || !workspace?.whatsappBusinessAccountId) {
            return NextResponse.json(
                { error: "WhatsApp is not connected. Configure it in Settings → WhatsApp first." },
                { status: 400 }
            );
        }

        // Validate placeholders are sequential starting at {{1}}
        const bodyVarCount = countPlaceholders(data.bodyText);
        for (let i = 1; i <= bodyVarCount; i++) {
            if (!new RegExp(`\\{\\{\\s*${i}\\s*\\}\\}`).test(data.bodyText)) {
                return NextResponse.json(
                    { error: `Variables must be sequential — {{${i}}} is missing` },
                    { status: 400 }
                );
            }
        }
        if (bodyVarCount > 0 && (data.bodyExamples?.length || 0) < bodyVarCount) {
            return NextResponse.json(
                { error: "Meta requires an example value for every {{n}} variable" },
                { status: 400 }
            );
        }

        const components: any[] = [];

        if (data.headerText) {
            const headerVars = countPlaceholders(data.headerText);
            if (headerVars > 1) {
                return NextResponse.json({ error: "Header supports at most one {{1}} variable" }, { status: 400 });
            }
            components.push({
                type: "HEADER",
                format: "TEXT",
                text: data.headerText,
                ...(headerVars === 1
                    ? { example: { header_text: [data.headerExample || "Example"] } }
                    : {}),
            });
        }

        components.push({
            type: "BODY",
            text: data.bodyText,
            ...(bodyVarCount > 0
                ? { example: { body_text: [data.bodyExamples!.slice(0, bodyVarCount)] } }
                : {}),
        });

        if (data.footerText) {
            components.push({ type: "FOOTER", text: data.footerText });
        }

        if (data.buttons && data.buttons.length > 0) {
            components.push({ type: "BUTTONS", buttons: data.buttons });
        }

        const token = decrypt(workspace.whatsappAccessToken);
        const wabaId = workspace.whatsappBusinessAccountId;

        const metaRes = await fetch(
            `https://graph.facebook.com/v18.0/${wabaId}/message_templates`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: data.name,
                    category: data.category,
                    language: data.language,
                    components,
                }),
            }
        );

        const metaData = await metaRes.json();

        if (!metaRes.ok || metaData.error) {
            // Surface Meta's own message — it explains exactly what to fix
            const msg = metaData.error?.error_user_msg || metaData.error?.message || "Meta rejected the template";
            return NextResponse.json({ error: msg }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            id: metaData.id,
            status: metaData.status, // usually PENDING
            message:
                metaData.status === "APPROVED"
                    ? "Template approved and ready to use — hit Sync on the Templates page."
                    : "Template submitted to Meta for review. Once approved (usually minutes to 24h), hit Sync on the Templates page.",
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
        }
        console.error("WhatsApp template create error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
