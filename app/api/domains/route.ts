import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Domain from "@/models/Domain";
import { createDomainSchema } from "@/lib/validations/domain";
import { checkDomainAuth } from "@/lib/email-auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const workspaceId = session.user.workspaceId;
        if (!workspaceId) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 400 });
        }

        await connectDB();

        const domains = await Domain.find({ workspaceId }).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: domains });
    } catch (error) {
        console.error("[DOMAINS_GET]", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const workspaceId = session.user.workspaceId;
        if (!workspaceId) {
            return NextResponse.json({ error: "Workspace not found" }, { status: 400 });
        }

        const body = await req.json();
        const result = createDomainSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 }
            );
        }

        await connectDB();

        // Scoped to the workspace: checking a domain is a read-only DNS lookup,
        // so two workspaces tracking the same domain is legitimate.
        const existingDomain = await Domain.findOne({ domainName: result.data.domainName, workspaceId });
        if (existingDomain) {
            return NextResponse.json(
                { error: "You have already added this domain" },
                { status: 400 }
            );
        }

        // Run the DNS check immediately so the row is never shown as an
        // uninformative "PENDING".
        const report = await checkDomainAuth(result.data.domainName, body.dkimSelector);

        const newDomain = await Domain.create({
            domainName: report.domain,
            workspaceId,
            dkimSelector: report.dkim.selector || body.dkimSelector || undefined,
            verificationStatus: report.authenticated ? "VERIFIED" : "PENDING",
            spf: report.spf,
            dkim: report.dkim,
            dmarc: report.dmarc,
            lastCheckedAt: report.checkedAt,
        });

        return NextResponse.json({ success: true, data: newDomain }, { status: 201 });
    } catch (error) {
        console.error("[DOMAINS_POST]", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
