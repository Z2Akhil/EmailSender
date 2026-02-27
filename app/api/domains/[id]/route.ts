import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Domain from "@/models/Domain";
import { deleteDomainIdentity } from "@/lib/email-service";

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const workspaceId = session.user.workspaceId;
        if (!workspaceId) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 400 });
        }

        const resolvedParams = await params;
        const id = resolvedParams.id;

        if (!id) {
            return NextResponse.json({ error: "Domain ID is required" }, { status: 400 });
        }

        await connectDB();

        const domain = await Domain.findOne({ _id: id, workspaceId });

        if (!domain) {
            return NextResponse.json({ error: "Domain not found" }, { status: 404 });
        }

        try {
            // Delete from AWS SES
            await deleteDomainIdentity(domain.domainName);
        } catch (sesError: any) {
            console.error("[DOMAINS_DELETE_SES_ERROR]", sesError);
            // We'll log the SES error but continue with DB deletion locally if it's already removed or not found
            // If it's a critical error (like wrong AWS credits), we may still want to allow the user to clean up their DB.
        }

        await Domain.findByIdAndDelete(id);

        return NextResponse.json({ success: true, message: "Domain deleted successfully" });
    } catch (error) {
        console.error("[DOMAINS_DELETE]", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
