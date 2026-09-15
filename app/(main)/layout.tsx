// app/(main)/layout.tsx
// StudyStream OS — Main authenticated app layout with responsive sidebar + mobile header
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ServerSidebar } from "@/components/server/ServerSidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="flex flex-col md:flex-row h-dvh bg-espresso-950 text-crema-100 overflow-hidden select-none">
      {/* Mobile Top Navigation */}
      <MobileHeader />

      {/* Desktop Left Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <ServerSidebar />
      </div>

      {/* Main Screen Content */}
      <main className="flex-1 min-w-0 h-full overflow-hidden relative flex flex-col">
        {children}
      </main>
    </div>
  );
}
