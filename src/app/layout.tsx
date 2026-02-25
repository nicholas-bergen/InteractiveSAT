import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Sora } from "next/font/google";
import type { ReactNode } from "react";

import "@/app/globals.css";
import "katex/dist/katex.min.css";

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap"
});

const displayFont = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Lesson Lab",
  description: "A local-first lesson app scaffold built with Next.js."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${displayFont.variable} antialiased`}>{children}</body>
    </html>
  );
}
