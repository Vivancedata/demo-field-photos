import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// Order matters: the design system defines tokens and base styles, then
// globals.css layers anything app-specific on top.
import "@vivancedata/ui/styles";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Field photos demo — VivanceData",
  description:
    "A site photo or scrawled note, matched to the right job. No confident match means no match — never the wrong job.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
