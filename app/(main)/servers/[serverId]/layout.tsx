// app/(main)/servers/[serverId]/layout.tsx
// StudyStream OS — Server layout with channel sidebar + room content

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ChannelSidebar } from "@/components/server/ChannelSidebar";

interface ServerLayoutProps {
  children: React.ReactNode;
  params: Promise<{ serverId: string }>;
}

export default async function ServerLayout({
  children,
  params,
}: ServerLayoutProps) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { serverId } = await params;

  return (
    <div className="flex h-full">
      {/* Left: Channel/Room list sidebar (240px wide) */}
      <ChannelSidebar serverId={serverId} />
      {/* Right: Room content */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
