import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Domain from "@/models/Domain";
import { getDomainVerificationStatus } from "@/lib/email-service";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        const domain = await Domain.findById(id);
        if (!domain) {
            return NextResponse.json({ error: "Domain not found" }, { status: 404 });
        }

        // Check if user is authorized to this domain's workspace
        if (domain.workspaceId.toString() !== session.user.workspaceId?.toString()) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Poll SES for latest status
        const [identityStatus, dkimInfo] = await Promise.all([
            getDomainVerificationStatus(domain.domainName),
            import("@/lib/email-service").then(m => m.getDomainDkimStatus(domain.domainName))
        ]);

        // Map SES status to our local status
        let localStatus: 'PENDING' | 'VERIFIED' | 'FAILED' = "PENDING";

        // Both identity AND DKIM must be successful for full verification in our app 
        // (optional, but encouraged for deliverability)
        if (identityStatus === "Success" && dkimInfo.status === "Success") {
            localStatus = "VERIFIED";
        } else if (identityStatus === "Failed" || dkimInfo.status === "Failed") {
            localStatus = "FAILED";
        }

        // Update local DB if status or tokens changed
        if (domain.verificationStatus !== localStatus || domain.dkimTokens?.length === 0) {
            domain.verificationStatus = localStatus;
            if (dkimInfo.tokens.length > 0) {
                domain.dkimTokens = dkimInfo.tokens;
            }
            await domain.save();
        }

        return NextResponse.json({ success: true, status: domain.verificationStatus });
    } catch (error) {
        console.error("[DOMAIN_VERIFY_GET]", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
