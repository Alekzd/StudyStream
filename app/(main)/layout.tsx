// app/(main)/layout.tsx
// StudyStream — Main authenticated app layout with responsive sidebar + mobile header + bottom nav
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { UnifiedSidebar } from "@/components/layout/UnifiedSidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { RoomPiPDock } from "@/components/room/RoomPiPDock";
import { GlobalAudioRenderer } from "@/components/soundscape/GlobalAudioRenderer";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="flex flex-col md:flex-row h-dvh bg-espresso-950 text-crema-100 overflow-hidden select-none relative">
      {/* Mobile Top Navigation */}
      <MobileHeader />

      {/* Desktop Left Sidebar (Unified Commons & Audio) */}
      <div className="hidden md:flex h-full shrink-0">
        <UnifiedSidebar />
      </div>

      {/* Main Screen Content */}
      <main className="flex-1 min-w-0 h-full overflow-hidden relative flex flex-col">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Floating Picture-in-Picture Room Mini Player (Appears when browsing Streak/Home) */}
      <RoomPiPDock />

      {/* Persistent Background Audio Stream (YouTube & Online streams) */}
      <GlobalAudioRenderer />
    </div>
  );
}
