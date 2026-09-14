// app/layout.tsx
// StudyStream OS — Root Layout with Clerk + Convex Providers

import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyStream OS — Virtual Study Spaces",
  description:
    "Study together with body doubling, synchronized Pomodoro, and ambient soundscapes. Alone, but never lonely.",
  keywords: ["study", "focus", "body doubling", "pomodoro", "virtual study room"],
  openGraph: {
    title: "StudyStream OS",
    description: "Virtual Study & Focus Platform — Zero Distraction",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="vi" suppressHydrationWarning>
        <body className="bg-neutral-950 text-neutral-100 antialiased">
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
