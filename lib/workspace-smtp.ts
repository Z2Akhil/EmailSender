/**
 * Loads a workspace's SMTP credentials into the shape `sendEmail` expects.
 *
 * Shared by the worker, the test-email route and the send preflight so all
 * three agree on what "configured" means and decrypt the password identically.
 */

import { Workspace } from "@/models/Workspace";
import { decrypt } from "./crypto";
import type { SmtpConfig } from "./email-service";

export async function getWorkspaceSmtpConfig(workspaceId: string): Promise<SmtpConfig | null> {
    const workspace = await Workspace.findById(workspaceId).select(
        "smtpHost smtpPort smtpUser smtpPass smtpSecure"
    );
    if (!workspace?.smtpHost || !workspace?.smtpPass) return null;

    return {
        host: workspace.smtpHost,
        port: workspace.smtpPort || 587,
        user: workspace.smtpUser || "",
        pass: decrypt(workspace.smtpPass),
        secure: workspace.smtpSecure ?? true,
    };
}
