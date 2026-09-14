// app/(main)/layout.tsx
// StudyStream OS — Main authenticated app layout with server sidebar

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ServerSidebar } from "@/components/server/ServerSidebar";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="flex h-screen bg-neutral-950 overflow-hidden">
      {/* Left: Narrow icon-only server list */}
      <ServerSidebar />
      {/* Right: Page content */}
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
