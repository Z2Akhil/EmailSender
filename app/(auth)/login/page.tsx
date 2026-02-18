import { LoginForm } from "@/components/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign In",
    description: "Sign in to your BulkMailer account",
};

export default function LoginPage() {
    return <LoginForm />;
}
