import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "BulkMailer — Bulk Email Marketing Platform",
    template: "%s | BulkMailer",
  },
  description:
    "Send bulk email campaigns to your contacts. Simple, affordable, and powerful email marketing for small businesses.",
  keywords: ["email marketing", "bulk email", "email campaigns", "newsletter"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
