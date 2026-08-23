import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Domain from "@/models/Domain";
import { checkDomainAuth } from "@/lib/email-auth";

/**
 * GET /api/domains/[id]/verify
 * Re-resolves SPF / DKIM / DMARC for the domain and caches the result. Purely a
 * DNS read — it provisions nothing and gates nothing, it just tells the user
 * which records are missing before they send a campaign.
 *
 * Optional query param: ?selector=<dkim-selector> to check a provider-specific
 * DKIM selector. It is remembered for later checks.
 */
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

        const domain = await Domain.findOne({ _id: id, workspaceId: session.user.workspaceId });
        if (!domain) {
            return NextResponse.json({ error: "Domain not found" }, { status: 404 });
        }

        const selector = new URL(req.url).searchParams.get("selector") || domain.dkimSelector || undefined;
        const report = await checkDomainAuth(domain.domainName, selector);

        domain.spf = report.spf;
        domain.dkim = report.dkim;
        domain.dmarc = report.dmarc;
        domain.dkimSelector = report.dkim.selector || selector;
        domain.lastCheckedAt = report.checkedAt;
        // FAIL only once a check has actually run and come back missing —
        // that is what distinguishes it from the initial PENDING state.
        domain.verificationStatus = report.authenticated
            ? "VERIFIED"
            : report.spf.status === "FAIL" || report.dkim.status === "FAIL" || report.dmarc.status === "FAIL"
                ? "FAILED"
                : "PENDING";
        await domain.save();

        return NextResponse.json({
            success: true,
            status: domain.verificationStatus,
            data: domain,
        });
    } catch (error) {
        console.error("[DOMAIN_VERIFY_GET]", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
