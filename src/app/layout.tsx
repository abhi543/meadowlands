import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meadowlands",
  description: "A cozy farming, crafting, and idle management game.",
  keywords: ["Meadowlands", "Farming Game", "Idle Game", "Next.js", "React"],
  openGraph: {
    title: "Meadowlands",
    description: "A cozy farming, crafting, and idle management game.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meadowlands",
    description: "A cozy farming, crafting, and idle management game.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
