import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DarkModeProvider } from "@/components/layout/DarkModeProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "InsightAI — Conversational Business Intelligence",
  description: "Generate interactive dashboards instantly through natural language queries. No SQL required.",
  keywords: ["AI", "Business Intelligence", "Dashboard", "Analytics", "Natural Language"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${inter.variable} font-sans antialiased text-gray-900 dark:text-gray-50 bg-slate-50 dark:bg-gray-950`}>
        <DarkModeProvider>
          {children}
        </DarkModeProvider>
      </body>
    </html>
  );
}
