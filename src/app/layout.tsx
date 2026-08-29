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

// `flex flex-col` on the body, not just `min-h-screen`: the page is a column so
// the footer can sit as a band at the foot of the viewport rather than as a rule
// floating a third of the way down an otherwise empty black page.
//
// (Keep comments out of the <html> element's children -- a JSX comment node
// between <html> and <body> breaks hydration, and the page silently stops
// responding to clicks.)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
