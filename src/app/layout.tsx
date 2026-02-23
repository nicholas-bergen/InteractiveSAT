import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "Lesson Lab",
  description: "A local-first lesson app scaffold built with Next.js."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
