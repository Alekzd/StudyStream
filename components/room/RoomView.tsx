"use client";

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
import { AppIcon } from "@/components/ui/Icon";
import { BannerBackground } from "@/components/ui/BannerBackground";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

interface RoomViewProps {
  serverId: string;
  roomId: string;
}

export function RoomView({ serverId, roomId }: RoomViewProps) {
  const { user } = useUser();
  const router = useRouter();
  const { t } = useLanguage();

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
      const { token, serverUrl } = await getLiveKitToken({
        roomId: roomId as Id<"rooms">,
        roomSlug: room.slug,
        archetype: room.archetype,
      });

      await joinRoom({
        roomId: roomId as Id<"rooms">,
        serverId: serverId as Id<"servers">,
        liveKitIdentity: user.id,
        currentIntention: undefined,
      });

      setLivekitToken(token);
      setLivekitUrl(serverUrl);
    } catch (err: any) {
      setError(err.message ?? t("room_connect_error"));
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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        if (
          (e.target as HTMLElement).tagName !== "INPUT" &&
          (e.target as HTMLElement).tagName !== "TEXTAREA"
        ) {
          setIsFullscreen((v) => !v);
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!room || !server) {
    return (
      <div className="flex items-center justify-center h-full bg-espresso-950">
        <div className="animate-pulse text-brass-500 font-mono text-sm">
          {t("room_loading")}
        </div>
      </div>
    );
  }

  const archetypeColor = getArchetypeColor(room.archetype);
  const archetypeLabel = getArchetypeLabel(room.archetype);

  // Pre-join Screen (The Entrance to The Atelier)
  if (!livekitToken) {
    return (
      <BannerBackground opacity={0.4}>
        <div className="flex flex-col items-center justify-center flex-1 h-full px-4 sm:px-8 py-8 gap-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-espresso-900 border border-espresso-700 flex items-center justify-center text-brass-500 shadow-xl">
            <AppIcon name="coffee" size={32} />
          </div>

          <div className="max-w-md">
            <h1 className="text-2xl sm:text-3xl font-bold text-crema-100 mb-2 font-sans tracking-tight">
              {room.name}
            </h1>
            <p className={cn("text-xs sm:text-sm font-mono font-semibold tracking-wider uppercase", archetypeColor)}>
              {archetypeLabel}
            </p>

            {room.archetype === "SILENT_FOCUS" && (
              <p className="text-crema-400 text-xs mt-3 bg-espresso-900/80 px-4 py-2 rounded-xl border border-espresso-700/80 leading-relaxed">
                {t("room_silent_notice")}
              </p>
            )}
          </div>

          {error && (
            <div className="px-4 py-2.5 bg-bourbon-700/30 border border-bourbon-500/50 rounded-xl text-bourbon-400 text-xs sm:text-sm max-w-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleEnterRoom}
            disabled={isJoining || !user}
            className="flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 bg-brass-500 hover:bg-brass-600 disabled:opacity-50 text-espresso-950 font-bold rounded-xl transition-all duration-200 text-sm sm:text-base shadow-lg active:scale-95"
          >
            <AppIcon name="videoOn" size={20} />
            <span>{isJoining ? t("room_connecting") : t("room_enter")}</span>
          </button>

          <p className="text-crema-600 text-xs font-mono">
            {t("room_fullscreen_hint")}
          </p>
        </div>
      </BannerBackground>
    );
  }

  // Active In-Room View
  return (
    <div
      className={cn(
        "flex flex-col h-full bg-espresso-950 transition-all duration-300 w-full overflow-hidden select-none",
        isFullscreen && "fixed inset-0 z-50"
      )}
    >
      {/* Top Station Bar */}
      <div
        className={cn(
          "flex items-center justify-between px-3 sm:px-4 py-2 bg-espresso-900/90 border-b border-espresso-700/80 backdrop-blur-md shrink-0 gap-2",
          isFullscreen && "opacity-0 hover:opacity-100 transition-opacity"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs text-brass-500 font-bold tracking-tight truncate hidden sm:inline">
            {archetypeLabel}
          </span>
          <span className="text-espresso-700 hidden sm:inline">|</span>
          <span className="text-crema-100 text-xs sm:text-sm font-semibold truncate">
            {room.name}
          </span>
        </div>

        {/* Compact Pomodoro & Control Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
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
                ? "text-brass-400 bg-brass-500/20 border border-brass-500/40"
                : "text-crema-600 hover:text-crema-200 hover:bg-espresso-800"
            )}
            title={t("soundscape_title")}
          >
            <AppIcon name="headphones" size={17} />
          </button>

          <button
            onClick={() => setIsSensoryFriendly((v) => !v)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isSensoryFriendly
                ? "text-bourbon-400 bg-bourbon-500/20 border border-bourbon-500/40"
                : "text-crema-600 hover:text-crema-200 hover:bg-espresso-800"
            )}
            title={isSensoryFriendly ? t("sensory_mode_on") : t("sensory_mode_off")}
          >
            <AppIcon name="eye" size={17} />
          </button>

          <button
            onClick={() => {
              setIsChatOpen((v) => !v);
              if (!isChatOpen) setIsSoundscapeOpen(false);
            }}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isChatOpen
                ? "text-brass-400 bg-brass-500/20 border border-brass-500/40"
                : "text-crema-600 hover:text-crema-200 hover:bg-espresso-800"
            )}
            title={t("chat_title")}
          >
            <AppIcon name="chat" size={17} />
          </button>

          {room.archetype === "SANDBOX_TEST" && (
            <button
              onClick={() => setShowDiagnosticHUD((v) => !v)}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showDiagnosticHUD
                  ? "text-bourbon-400 bg-bourbon-500/20"
                  : "text-crema-600 hover:text-bourbon-400"
              )}
              title={t("diagnostic_hud_title")}
            >
              <AppIcon name="flask" size={17} />
            </button>
          )}

          <button
            onClick={() => setIsFullscreen((v) => !v)}
            className="p-2 text-crema-600 hover:text-crema-200 hover:bg-espresso-800 rounded-lg transition-colors hidden sm:inline-flex"
            title={t("room_fullscreen_title")}
          >
            <AppIcon name="maximize" size={17} />
          </button>

          <button
            onClick={handleLeaveRoom}
            className="p-2 text-bourbon-500 hover:text-bourbon-400 hover:bg-espresso-800 rounded-lg transition-colors"
            title={t("room_leave")}
          >
            <AppIcon name="logout" size={17} />
          </button>
        </div>
      </div>

      {/* Center Video Grid Area with Drawers */}
      <div className="flex flex-1 overflow-hidden relative w-full">
        <div className="flex-1 overflow-hidden w-full h-full">
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
