// app/layout.tsx
// StudyStream — Root Layout with Clerk + Convex Providers + LanguageProvider
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
  title: "StudyStream — Virtual Study & Body Doubling Platform",
  description:
    "Pure web-based virtual study platform with synchronized Pomodoro, webcam body doubling, and ambient soundscapes.",
  keywords: ["study", "focus", "body doubling", "pomodoro", "virtual study room", "studystream"],
  openGraph: {
    title: "StudyStream — Virtual Study & Body Doubling Platform",
    description: "Deep Focus Workstation — Zero Distraction",
    type: "website",
  },
};

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  "pk_test_ZnVsbC1sYWR5YmlyZC0zNDIyLmNsZXJrLmFjY291bnRzLmRldiQ";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <html lang="en" className="dark bg-espresso-950" suppressHydrationWarning>
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
