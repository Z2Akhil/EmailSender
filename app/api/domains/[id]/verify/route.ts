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
        const sesStatus = await getDomainVerificationStatus(domain.domainName);

        // Map SES status to our local status
        let localStatus: 'PENDING' | 'VERIFIED' | 'FAILED' = "PENDING";
        if (sesStatus === "Success") {
            localStatus = "VERIFIED";
        } else if (sesStatus === "Failed") {
            localStatus = "FAILED";
        }

        // Update local DB if status changed
        if (domain.verificationStatus !== localStatus) {
            domain.verificationStatus = localStatus;
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
