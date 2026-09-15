// app/(main)/servers/[serverId]/layout.tsx
// StudyStream OS — Server layout with responsive channel sidebar + room viewport
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
    <div className="flex h-full w-full overflow-hidden bg-espresso-950">
      {/* Left: Channel/Room list sidebar (visible on sm+ screens) */}
      <div className="hidden sm:flex h-full shrink-0">
        <ChannelSidebar serverId={serverId} />
      </div>
      {/* Right: Room content */}
      <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">{children}</div>
    </div>
  );
}
