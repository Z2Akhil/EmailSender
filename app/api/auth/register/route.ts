import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Workspace } from "@/models/Workspace";
import { WorkspaceMember } from "@/models/Workspace";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate input
        const result = registerSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, email, password } = result.data;

        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        // Create user (password hashed by pre-save hook)
        const user = await User.create({ name, email, password, providers: ["credentials"] });

        // Create default workspace. If this fails, roll back the user so we
        // never leave a half-registered account (login would succeed but every
        // API call would 401 for lack of a workspaceId).
        try {
            const workspace = await Workspace.create({
                name: `${name}'s Workspace`,
                ownerId: user._id,
            });

            await WorkspaceMember.create({
                userId: user._id,
                workspaceId: workspace._id,
                role: "OWNER",
            });
        } catch (workspaceError) {
            await User.findByIdAndDelete(user._id).catch(() => { });
            throw workspaceError;
        }

        return NextResponse.json(
            {
                success: true,
                message: "Account created successfully",
                user: { id: user._id.toString(), name: user.name, email: user.email },
            },
            { status: 201 }
        );
    } catch (error: any) {
        // Duplicate email race (unique index) — two signups at once
        if (error?.code === 11000) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 }
            );
        }

        console.error("[REGISTER_ERROR]", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
}
