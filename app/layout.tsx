import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resumate | AI-Powered LaTeX Resume Optimizer",
  description: "Transform your career with high-precision LaTeX resume optimization. Resumate uses advanced AI to align your skills with job requirements in seconds.",
  keywords: ["resume", "latex", "ai resume", "job optimization", "career tool", "latex resume editor"],
  authors: [{ name: "Resumate Team" }],
  openGraph: {
    title: "Resumate | AI-Powered LaTeX Resume Optimizer",
    description: "The future of resumes. High-precision LaTeX resume tailoring designed for the modern career.",
    url: "https://resumate.ai",
    siteName: "Resumate",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resumate | AI-Powered LaTeX Resume Optimizer",
    description: "Transform your career with high-precision LaTeX resume optimization.",
  },
};

import { AppShell } from "@/components/layout/app-shell";
import { GeminiConfigProvider } from "@/hooks/use-gemini-config";
import { CandidateProfileProvider } from "@/hooks/use-candidate-profile";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="h-full w-full overflow-hidden bg-[#09090b] text-neutral-100">
        <GeminiConfigProvider>
          <CandidateProfileProvider>
            <AppShell>{children}</AppShell>
          </CandidateProfileProvider>
        </GeminiConfigProvider>
      </body>
    </html>
  );
}
