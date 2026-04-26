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
    description: "The future of resumes. High-precision LaTeX transformer designed for the modern career.",
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

import { Header } from "@/components/layout/header";
import { GeminiConfigProvider } from "@/hooks/use-gemini-config";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full w-full flex flex-col overflow-hidden bg-[#f8f8f8] dark:bg-[#0d0d0d] text-neutral-900 dark:text-neutral-100 selection:bg-indigo-500/20">
        <GeminiConfigProvider>
          <Header />
          <div className="flex-1 overflow-auto flex flex-col relative">
            {children}
          </div>
        </GeminiConfigProvider>
      </body>
    </html>
  );
}
