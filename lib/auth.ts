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
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            // Handle Google OAuth — create user if first time
            if (account?.provider === "google") {
                await connectDB();

                const existingUser = await User.findOne({ email: user.email });

                if (!existingUser) {
                    // Create new user from Google profile
                    const userData: Partial<IUser> = {
                        name: user.name ?? "User",
                        email: user.email ?? "",
                        emailVerified: new Date(),
                    };
                    if (user.image) userData.image = user.image;

                    const newUser = await User.create(userData) as IUser;
                    const newUserId = (newUser._id as mongoose.Types.ObjectId).toString();

                    // Create default workspace
                    const workspace = await Workspace.create({
                        name: `${userData.name}'s Workspace`,
                        ownerId: newUser._id,
                    });

                    await WorkspaceMember.create({
                        userId: newUser._id,
                        workspaceId: workspace._id,
                        role: "OWNER",
                    });

                    user.id = newUserId;
                    (user as any).plan = newUser.plan;
                } else {
                    user.id = (existingUser._id as mongoose.Types.ObjectId).toString();
                    (user as any).plan = existingUser.plan;
                }
            }

            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.plan = (user as any).plan ?? "FREE";
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
            }
            return session;
        },
    },
};
