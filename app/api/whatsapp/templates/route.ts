import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Workspace } from "@/models/Workspace";
import { Template } from "@/models/Template";
import { decrypt } from "@/lib/crypto";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        const workspaceId = session.user.workspaceId;

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace || !workspace.whatsappAccessToken || !workspace.whatsappBusinessAccountId) {
            return NextResponse.json({ error: "WhatsApp is not configured for this workspace" }, { status: 400 });
        }

        const token = decrypt(workspace.whatsappAccessToken);
        const wabaId = workspace.whatsappBusinessAccountId;

        // Fetch templates from Meta API
        const metaRes = await fetch(`https://graph.facebook.com/v18.0/${wabaId}/message_templates`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await metaRes.json();

        if (data.error) {
            return NextResponse.json({ error: data.error.message }, { status: 400 });
        }

        // Sync to our local DB
        const templates = data.data.filter((tmpl: any) => tmpl.status === "APPROVED");

        // Let's store or update them
        for (const tmpl of templates) {
            await Template.findOneAndUpdate(
                {
                    workspaceId,
                    type: "WHATSAPP",
                    whatsappTemplateName: tmpl.name,
                    whatsappTemplateLanguage: tmpl.language
                },
                {
                    name: tmpl.name,
                    type: "WHATSAPP",
                    whatsappTemplateName: tmpl.name,
                    whatsappTemplateLanguage: tmpl.language,
                    whatsappTemplateComponents: tmpl.components,
                    isGlobal: false,
                    workspaceId
                },
                { upsert: true, new: true }
            );
        }

        return NextResponse.json({ templates }, { status: 200 });

    } catch (error) {
        console.error("WhatsApp Template Sync error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
