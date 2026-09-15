"use client";
// components/room/RoomView.tsx
// StudyStream OS — Main room orchestrator component
// Handles token fetching, joining, and full room UI assembly

import { useState, useEffect } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { StudyVideoGrid } from "./StudyVideoGrid";
import { PomodoroTimer } from "@/components/pomodoro/PomodoroTimer";
import { ChatDrawer } from "./ChatDrawer";
import { SoundscapeMixer } from "@/components/soundscape/SoundscapeMixer";
import { DiagnosticHUD } from "./DiagnosticHUD";
import { getArchetypeLabel, getArchetypeColor, cn } from "@/lib/utils";
import { MessageSquare, Volume2, Maximize2, LogOut, Headphones, Eye, Sparkles, FlaskConical } from "lucide-react";
import { useRouter } from "next/navigation";

interface RoomViewProps {
  serverId: string;
  roomId: string;
}

export function RoomView({ serverId, roomId }: RoomViewProps) {
  const { user } = useUser();
  const router = useRouter();

  const room = useQuery(api.rooms.getRoomById, {
    roomId: roomId as Id<"rooms">,
  });
  const server = useQuery(api.servers.getServerById, {
    serverId: serverId as Id<"servers">,
  });
  const currentUser = useQuery(api.users.getCurrentUser);

  const getLiveKitToken = useAction(api.livekit.getRoomToken);
  const joinRoom = useMutation(api.rooms.joinRoom);
  const leaveRoom = useMutation(api.rooms.leaveRoom);

  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSoundscapeOpen, setIsSoundscapeOpen] = useState(false);
  const [isSensoryFriendly, setIsSensoryFriendly] = useState(false);
  const [showDiagnosticHUD, setShowDiagnosticHUD] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Determine user's role in this server
  const myRole = (server as any)?.myRole as string | undefined;
  const canControlPomodoro = myRole === "owner" || myRole === "moderator";

  const handleEnterRoom = async () => {
    if (!room || !user || !currentUser) return;

    setIsJoining(true);
    setError(null);

    try {
      // 1. Get LiveKit JWT from Convex action (keeps secret key server-side)
      const { token, serverUrl } = await getLiveKitToken({
        roomId: roomId as Id<"rooms">,
        roomSlug: room.slug,
        archetype: room.archetype,
      });

      // 2. Record join event in Convex (for presence tracking)
      await joinRoom({
        roomId: roomId as Id<"rooms">,
        serverId: serverId as Id<"servers">,
        liveKitIdentity: user.id,
        currentIntention: undefined,
      });

      setLivekitToken(token);
      setLivekitUrl(serverUrl);
    } catch (err: any) {
      setError(err.message ?? "Không thể kết nối phòng học. Thử lại!");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom({ roomId: roomId as Id<"rooms"> });
    } catch {}
    setLivekitToken(null);
    setLivekitUrl(null);
    router.push(`/servers/${serverId}`);
  };

  // Fullscreen toggle with keyboard shortcut F
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        if ((e.target as HTMLElement).tagName !== "INPUT" &&
          (e.target as HTMLElement).tagName !== "TEXTAREA") {
          setIsFullscreen((v) => !v);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!room || !server) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-neutral-500">Đang tải phòng học...</div>
      </div>
    );
  }

  const archetypeColor = getArchetypeColor(room.archetype);
  const archetypeLabel = getArchetypeLabel(room.archetype);

  // Pre-join screen
  if (!livekitToken) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        {/* Room info */}
        <div className="text-center max-w-md">
          <p className={cn("text-4xl mb-3", archetypeColor.replace("text-", ""))}>{archetypeLabel.split(" ")[0]}</p>
          <h1 className="text-2xl font-bold text-neutral-100 mb-2">{room.name}</h1>
          <p className={cn("text-sm font-medium", archetypeColor)}>{archetypeLabel}</p>

          {room.archetype === "SILENT_FOCUS" && (
            <p className="text-neutral-500 text-xs mt-3 bg-neutral-900 px-4 py-2 rounded-lg border border-neutral-800">
              🔇 Phòng im lặng: Micro sẽ bị tắt cưỡng chế. Chỉ camera và chat.
            </p>
          )}
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-950/40 border border-red-800/50 rounded-lg text-red-400 text-sm max-w-sm text-center">
            {error}
          </div>
        )}

        {/* Enter button */}
        <button
          onClick={handleEnterRoom}
          disabled={isJoining || !user}
          className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-lg"
        >
          {isJoining ? "Đang kết nối..." : "📹 Vào Phòng Học"}
        </button>

        <p className="text-neutral-600 text-xs">
          Nhấn{" "}
          <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-400 font-mono">
            F
          </kbd>{" "}
          để toàn màn hình sau khi vào phòng
        </p>
      </div>
    );
  }

  // In-room view
  return (
    <div
      className={cn(
        "flex flex-col h-full bg-neutral-950 transition-all duration-300",
        isFullscreen && "fixed inset-0 z-50"
      )}
    >
      {/* Top bar */}
      <div className={cn(
        "flex items-center justify-between px-4 py-2 bg-neutral-900/80 border-b border-neutral-800 backdrop-blur-sm",
        isFullscreen && "opacity-0 hover:opacity-100 transition-opacity"
      )}>
        <div className="flex items-center gap-3">
          <span className={cn("text-sm font-medium", archetypeColor)}>
            {archetypeLabel}
          </span>
          <span className="text-neutral-600">·</span>
          <span className="text-neutral-300 text-sm font-semibold">{room.name}</span>
        </div>

        {/* Compact Pomodoro in header */}
        <div className="flex items-center gap-2">
          <PomodoroTimer
            roomId={roomId as Id<"rooms">}
            serverId={serverId as Id<"servers">}
            canControl={canControlPomodoro}
            compact
          />

          <button
            onClick={() => {
              setIsSoundscapeOpen((v) => !v);
              if (!isSoundscapeOpen) setIsChatOpen(false);
            }}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isSoundscapeOpen
                ? "text-indigo-400 bg-indigo-950/40"
                : "text-neutral-500 hover:text-neutral-300"
            )}
            title="Bộ hòa âm không gian (Rain/Lofi)"
          >
            <Headphones size={18} />
          </button>

          <button
            onClick={() => setIsSensoryFriendly((v) => !v)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isSensoryFriendly
                ? "text-amber-400 bg-amber-950/40"
                : "text-neutral-500 hover:text-neutral-300"
            )}
            title={isSensoryFriendly ? "Chế độ ADHD/Sensory: BẬT" : "Bật chế độ dịu mắt (ADHD Friendly)"}
          >
            <Eye size={18} />
          </button>

          <button
            onClick={() => {
              setIsChatOpen((v) => !v);
              if (!isChatOpen) setIsSoundscapeOpen(false);
            }}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isChatOpen
                ? "text-indigo-400 bg-indigo-950/40"
                : "text-neutral-500 hover:text-neutral-300"
            )}
            title="Chat phòng"
          >
            <MessageSquare size={18} />
          </button>

          {room.archetype === "SANDBOX_TEST" && (
            <button
              onClick={() => setShowDiagnosticHUD((v) => !v)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showDiagnosticHUD
                  ? "text-orange-400 bg-orange-950/40"
                  : "text-neutral-500 hover:text-orange-400"
              )}
              title="Bảng chẩn đoán Sandbox (HUD)"
            >
              <FlaskConical size={18} />
            </button>
          )}

          <button
            onClick={() => setIsFullscreen((v) => !v)}
            className="p-2 text-neutral-500 hover:text-neutral-300 transition-colors"
            title="Toàn màn hình (phím F)"
          >
            <Maximize2 size={18} />
          </button>

          <button
            onClick={handleLeaveRoom}
            className="p-2 text-red-500 hover:text-red-400 transition-colors"
            title="Rời phòng"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main content: Video Grid + optional Drawers & Diagnostic HUD */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 overflow-hidden">
          <StudyVideoGrid
            serverUrl={livekitUrl!}
            token={livekitToken}
            roomArchetype={room.archetype}
            isSensoryFriendly={isSensoryFriendly}
            onDisconnect={handleLeaveRoom}
          />
        </div>

        {showDiagnosticHUD && (
          <DiagnosticHUD
            roomSlug={room.slug}
            onClose={() => setShowDiagnosticHUD(false)}
          />
        )}

        {isSoundscapeOpen && (
          <SoundscapeMixer onClose={() => setIsSoundscapeOpen(false)} />
        )}

        {isChatOpen && (
          <ChatDrawer
            roomId={roomId as Id<"rooms">}
            serverId={serverId as Id<"servers">}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
