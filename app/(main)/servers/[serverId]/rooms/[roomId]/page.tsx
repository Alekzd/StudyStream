// app/(main)/servers/[serverId]/rooms/[roomId]/page.tsx
// StudyStream — Room view page (video grid + pomodoro + chat)

import { RoomView } from "@/components/room/RoomView";

interface RoomPageProps {
  params: Promise<{ serverId: string; roomId: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { serverId, roomId } = await params;

  return <RoomView serverId={serverId} roomId={roomId} />;
}
