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
  title: "resumate",
  description: "AI-powered LaTeX resume optimizer",
};

import { Header } from "@/components/layout/header";

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
        <Header />
        <div className="flex-1 overflow-auto flex flex-col relative">
          {children}
        </div>
      </body>
    </html>
  );
}
