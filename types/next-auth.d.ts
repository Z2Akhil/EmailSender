import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            plan: string;
            workspaceId: string;
            isProfileComplete: boolean;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        plan?: string;
        isProfileComplete?: boolean;
    }
}
