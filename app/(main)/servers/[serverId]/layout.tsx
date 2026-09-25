// app/(main)/servers/[serverId]/layout.tsx
// StudyStream — Server layout with responsive channel sidebar + room viewport
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

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

  await params;

  return (
    <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col bg-espresso-950">
      {children}
    </div>
  );
}
