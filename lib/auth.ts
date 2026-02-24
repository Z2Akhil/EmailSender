import mongoose from "mongoose";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/lib/db";
import { User, IUser } from "@/models/User";
import { Workspace } from "@/models/Workspace";
import { WorkspaceMember } from "@/models/Workspace";

export const authOptions: NextAuthOptions = {
    // JWT strategy — no database adapter needed
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
        error: "/login",
    },
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                await connectDB();

                // Explicitly select password field (excluded by default)
                const user = await User.findOne({ email: credentials.email }).select("+password");

                if (!user) {
                    throw new Error("No account found with this email");
                }

                if (!user.password) {
                    throw new Error("Please sign in with Google");
                }

                const isPasswordValid = await user.comparePassword(credentials.password);

                if (!isPasswordValid) {
                    throw new Error("Invalid password");
                }

                return {
                    id: (user._id as mongoose.Types.ObjectId).toString(),
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    plan: user.plan,
                    isProfileComplete: user.isProfileComplete,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            // Handle Google OAuth — create user if first time or link account
            if (account?.provider === "google") {
                await connectDB();

                const existingUser = await User.findOne({ email: user.email });

                if (!existingUser) {
                    // Create new user from Google profile
                    const userData: Partial<IUser> = {
                        name: user.name ?? "User",
                        email: user.email ?? "",
                        emailVerified: new Date(),
                        providers: ["google"],
                    };
                    if (user.image) userData.image = user.image;

                    const newUser = await User.create(userData) as IUser;

                    // Create default workspace for new Google user
                    const workspace = await Workspace.create({
                        name: `${userData.name}'s Workspace`,
                        ownerId: newUser._id,
                    });

                    await WorkspaceMember.create({
                        userId: newUser._id,
                        workspaceId: workspace._id,
                        role: "OWNER",
                    });

                } else {
                    // LINK ACCOUNT: If user exists but hasn't logged in with Google before
                    if (!existingUser.providers.includes("google")) {
                        existingUser.providers.push("google");
                        // Only save if we are actually adding the provider to avoid redundant writes
                        await existingUser.save();
                    }
                }
            }

            return true;
        },
        async jwt({ token, user, account, trigger }) {
            // Handle session update
            if (trigger === "update" && token.id) {
                await connectDB();
                const dbUser = await User.findById(token.id);
                if (dbUser) {
                    token.name = dbUser.name;
                    token.isProfileComplete = dbUser.isProfileComplete;
                }
            }

            // Initial sign in
            if (user) {
                if (account?.provider === "google") {
                    // Crucial Fix: Fetch the actual DB user, because `user.id` from Google is just the Google profile ID (e.g. "103289...")
                    await connectDB();
                    const dbUser = await User.findOne({ email: user.email });
                    if (dbUser) {
                        token.id = dbUser._id.toString();
                        token.plan = dbUser.plan ?? "FREE";
                        token.name = dbUser.name; // Use local db name
                        token.isProfileComplete = dbUser.isProfileComplete;
                    } else {
                        // Fallback (though the signIn callback guarantees dbUser exists by this point)
                        token.id = user.id;
                    }
                } else {
                    // Credentials login already maps database _id directly natively
                    token.id = user.id;
                    token.plan = (user as any).plan ?? "FREE";
                    // For credentials login, user.isProfileComplete needs to be fetched, or we can assume it might be on the user object if returned from authorize.
                    // However, to be safe, we should probably fetch it if not mapped. But we can fetch it when workspace is resolved below or just here:
                    if (user && 'isProfileComplete' in user) {
                        token.isProfileComplete = (user as any).isProfileComplete;
                    }
                }
            }

            // Always ensure workspaceId is in the token if we have a user ID
            if (token.id && !token.workspaceId) {
                await connectDB();
                const member = await WorkspaceMember.findOne({ userId: token.id });
                if (member) {
                    token.workspaceId = member.workspaceId.toString();
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.plan = (token.plan as string) ?? "FREE";
                session.user.workspaceId = token.workspaceId as string;
                session.user.isProfileComplete = token.isProfileComplete as boolean;
                if (token.name) {
                    session.user.name = token.name as string;
                }
            }
            return session;
        },
    },
};
