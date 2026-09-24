// app/layout.tsx
// StudyStream OS — Root Layout with Clerk + Convex Providers + LanguageProvider
import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "./providers";
import { LanguageProvider } from "@/context/LanguageContext";
import { ActiveRoomProvider } from "@/context/ActiveRoomContext";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0c0a09",
};

export const metadata: Metadata = {
  title: "StudyStream OS — The Midnight Espresso Atelier",
  description:
    "Pure dark mode virtual study & deep work sanctuary for coffeeholics and workaholics. Synchronized Pomodoro, body doubling, and vintage jazz soundscapes.",
  keywords: ["study", "focus", "body doubling", "pomodoro", "espresso", "jazz", "virtual study room"],
  openGraph: {
    title: "StudyStream OS — The Midnight Espresso Atelier",
    description: "Deep Focus Workstation — Zero Distraction",
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
      <html lang="vi" className="dark bg-espresso-950" suppressHydrationWarning>
        <body className="bg-espresso-950 text-crema-100 antialiased min-h-dvh flex flex-col selection:bg-brass-500/30 selection:text-brass-300">
          <ConvexClientProvider>
            <LanguageProvider>
              <ActiveRoomProvider>
                {children}
              </ActiveRoomProvider>
            </LanguageProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
