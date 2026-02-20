import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Workspace } from "@/models/Workspace";
import { z } from "zod";
import nodemailer from "nodemailer";
import { encrypt, decrypt } from "@/lib/crypto";
import { requireAuth } from "@/lib/api-utils";

const smtpSchema = z.object({
    smtpHost: z.string().trim().toLowerCase().min(1, "Host is required"),
    smtpPort: z.number().int().positive("Port must be a positive number"),
    smtpUser: z.string().trim().min(1, "User is required"),
    smtpPass: z.string().min(1, "Password is required"),
    smtpSecure: z.boolean().default(true),
});

export async function GET() {
    try {
        const { session, response } = await requireAuth();
        if (response) return response;

        await connectDB();
        const workspace = await Workspace.findById(session!.user.workspaceId)
            .select("smtpHost smtpPort smtpUser smtpSecure");

        if (!workspace) {
            return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: {
                smtpHost: workspace.smtpHost,
                smtpPort: workspace.smtpPort,
                smtpUser: workspace.smtpUser,
                smtpSecure: workspace.smtpSecure,
                smtpPass: workspace.smtpHost ? "••••••••" : "", // Masked
            }
        });
    } catch (error) {
        console.error("[SETTINGS_SMTP_GET]", error);
        return NextResponse.json({ success: false, error: "SMTP_FETCH_ERROR" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    let transporter;
    try {
        const { session, response } = await requireAuth();
        if (response) return response;

        const body = await req.json();
        const { testOnly, sendTestEmail, testRecipient, ...smtpData } = body;

        const validated = smtpSchema.parse(smtpData);

        // 1. Resolve Password (use raw if provided, else decrypt existing if it's the mask)
        let rawPass = validated.smtpPass;
        if (rawPass === "••••••••") {
            await connectDB();
            const existing = await Workspace.findById(session!.user.workspaceId).select("smtpPass");
            if (!existing?.smtpPass) {
                return NextResponse.json({ success: false, error: "Password is required for first-time setup" }, { status: 400 });
            }
            try {
                rawPass = decrypt(existing.smtpPass);
            } catch (e) {
                return NextResponse.json({ success: false, error: "Failed to decrypt existing password" }, { status: 500 });
            }
        }

        // 2. Setup Transporter
        transporter = nodemailer.createTransport({
            host: validated.smtpHost,
            port: validated.smtpPort,
            secure: validated.smtpSecure,
            auth: {
                user: validated.smtpUser,
                pass: rawPass,
            },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
            tls: {
                rejectUnauthorized: process.env.NODE_ENV === "production"
            }
        });

        // 3. Verify Connection
        try {
            await transporter.verify();

            // 4. Handle Test Email if requested
            if (sendTestEmail && testRecipient) {
                await transporter.sendMail({
                    from: `"${session!.user.name}" <${validated.smtpUser}>`,
                    to: testRecipient,
                    subject: "BulkMailer SMTP Test",
                    text: "Your SMTP settings are working correctly!",
                    html: "<b>Your SMTP settings are working correctly!</b>",
                });
            }
        } catch (err: any) {
            console.error("[SMTP_VERIFY_ERROR]", err);
            let errorMessage = "Connection test failed";
            if (err.code === "ETIMEDOUT" || err.command === "CONN") {
                errorMessage = "Connection timed out. Check if your provider blocks SMTP ports (465/587).";
            } else if (err.code === "EAUTH") {
                errorMessage = "Authentication failed. For Gmail, use an 'App Password'.";
            } else if (err.code === "ESOCKET") {
                errorMessage = `Socket error. Port/Security mismatch? (Port: ${validated.smtpPort})`;
            }
            return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
        } finally {
            if (transporter) transporter.close();
        }

        if (testOnly || sendTestEmail) {
            return NextResponse.json({ success: true, message: sendTestEmail ? "Test email sent!" : "SMTP connection verified" });
        }

        // 5. Save Configuration
        await connectDB();

        // Only encrypt and save if it's NOT the mask
        const finalUpdate: any = {
            smtpHost: validated.smtpHost,
            smtpPort: validated.smtpPort,
            smtpUser: validated.smtpUser,
            smtpSecure: validated.smtpSecure,
        };

        if (validated.smtpPass !== "••••••••") {
            finalUpdate.smtpPass = encrypt(validated.smtpPass);
        }

        const workspace = await Workspace.findByIdAndUpdate(
            session!.user.workspaceId,
            finalUpdate,
            { new: true }
        ).select("smtpHost smtpPort smtpUser smtpSecure updatedAt");

        return NextResponse.json({
            success: true,
            data: {
                ...workspace?.toObject(),
                smtpPass: "••••••••" // Return masked
            }
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const issues = error.issues.map(i => i.message).join(". ");
            return NextResponse.json({ success: false, error: issues }, { status: 400 });
        }
        console.error("[SETTINGS_SMTP_POST]", error);
        return NextResponse.json({ success: false, error: "SMTP_CONFIG_ERROR" }, { status: 500 });
    }
}
