import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db";
import Domain from "@/models/Domain";
import { createDomainSchema } from "@/lib/validations/domain";
import { requestDomainVerification } from "@/lib/email-service";

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

        // Check if domain already exists
        const existingDomain = await Domain.findOne({ domainName: result.data.domainName });
        if (existingDomain) {
            return NextResponse.json(
                { error: "Domain already registered" },
                { status: 400 }
            );
        }

        // Call SES to start verification
        const [verificationToken, dkimTokens] = await Promise.all([
            requestDomainVerification(result.data.domainName),
            import("@/lib/email-service").then(m => m.getDomainDkimTokens(result.data.domainName))
        ]);

        const newDomain = await Domain.create({
            domainName: result.data.domainName,
            workspaceId,
            verificationStatus: "PENDING",
            verificationToken,
            dkimTokens,
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
