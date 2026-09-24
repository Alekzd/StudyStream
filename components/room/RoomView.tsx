"use client";

import { useState, useEffect } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { StudyVideoGrid } from "./StudyVideoGrid";
import { PomodoroTimer } from "@/components/pomodoro/PomodoroTimer";
import { ChatDrawer } from "./ChatDrawer";
import { getArchetypeLabel, getArchetypeColor, cn, cleanTitle } from "@/lib/utils";
import { AppIcon } from "@/components/ui/Icon";
import { BannerBackground } from "@/components/ui/BannerBackground";
import { useLanguage } from "@/context/LanguageContext";
import { useActiveRoom } from "@/context/ActiveRoomContext";
import { useRouter } from "next/navigation";
import { PageTransition, MotionButton, AtelierLoader } from "@/components/ui/motion";

interface RoomViewProps {
  serverId: string;
  roomId: string;
}

export function RoomView({ serverId, roomId }: RoomViewProps) {
  const { user } = useUser();
  const router = useRouter();
  const { t, language } = useLanguage();

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
  const toggleRoomLock = useMutation(api.rooms.toggleRoomLock);
  const updateMediaState = useMutation(api.rooms.updateMediaState);
  const { activeRoom, setActiveRoom } = useActiveRoom();
  const isCurrentActiveRoom = activeRoom?.roomId === roomId;

  const [localToken, setLocalToken] = useState<string | null>(null);
  const [localUrl, setLocalUrl] = useState<string | null>(null);

  // Derived token & url: immediately active if user is returning to their active room session
  const livekitToken = (isCurrentActiveRoom ? activeRoom?.livekitToken : null) || localToken;
  const livekitUrl = (isCurrentActiveRoom ? activeRoom?.livekitUrl : null) || localUrl;

  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSoundscapeOpen, setIsSoundscapeOpen] = useState(false);
  const [isSensoryFriendly, setIsSensoryFriendly] = useState(false);
  const [showDiagnosticHUD, setShowDiagnosticHUD] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [intention, setIntention] = useState("");
  const [isEditingIntention, setIsEditingIntention] = useState(false);
  const [isGoalCompleted, setIsGoalCompleted] = useState(false);

  const myRole = (server as { myRole?: string } | null | undefined)?.myRole;
  const isRoomHost = Boolean(room?.currentHostId && currentUser?._id === room.currentHostId);
  const isPublicServer = Boolean((server as { isPublic?: boolean } | null | undefined)?.isPublic);
  const canControlPomodoro = myRole === "owner" || myRole === "moderator" || isRoomHost || !room?.isLocked || isPublicServer;

  const handleToggleLock = async () => {
    if (!room) return;
    try {
      await toggleRoomLock({ roomId: roomId as Id<"rooms"> });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to toggle lock";
      setError(msg);
    }
  };

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
        currentIntention: intention.trim() || undefined,
        password: passwordInput.trim() || undefined,
      });

      setLocalToken(token);
      setLocalUrl(serverUrl);

      setActiveRoom((prev) => ({
        roomId,
        serverId,
        roomName: room.name,
        roomArchetype: room.archetype,
        roomSlug: room.slug,
        joinedAt: prev?.roomId === roomId ? prev.joinedAt : Date.now(),
        livekitToken: token,
        livekitUrl: serverUrl,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("room_connect_error");
      setError(msg);
    } finally {
      setIsJoining(false);
    }
  };

  useEffect(() => {
    if (room && livekitToken) {
      setActiveRoom((prev) => {
        if (
          prev?.roomId === roomId &&
          prev?.livekitToken === livekitToken &&
          prev?.roomName === room.name &&
          prev?.roomArchetype === room.archetype
        ) {
          return prev;
        }
        return {
          roomId,
          serverId,
          roomName: room.name,
          roomArchetype: room.archetype,
          roomSlug: room.slug,
          joinedAt: prev?.roomId === roomId ? prev.joinedAt : Date.now(),
          livekitToken,
          livekitUrl,
        };
      });
    }
  }, [room, livekitToken, livekitUrl, roomId, serverId, setActiveRoom]);

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom({ roomId: roomId as Id<"rooms"> });
    } catch {}
    setActiveRoom(null);
    setLocalToken(null);
    setLocalUrl(null);
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
        <AtelierLoader label={t("room_loading")} />
      </div>
    );
  }

  const archetypeColor = getArchetypeColor(room.archetype);
  const archetypeLabel = getArchetypeLabel(room.archetype, language);

  // Pre-join Screen (The Entrance to The Atelier)
  if (!livekitToken) {
    return (
      <BannerBackground opacity={0.4}>
        <PageTransition className="flex flex-col items-center justify-center flex-1 h-full px-4 sm:px-8 py-8 gap-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-espresso-900 border border-espresso-700 flex items-center justify-center text-brass-500 shadow-xl">
            <AppIcon name="coffee" size={32} />
          </div>

          <div className="max-w-md">
            <h1 className="text-2xl sm:text-3xl font-bold text-crema-100 mb-2 font-sans tracking-tight">
              {cleanTitle(room.name)}
            </h1>
            <p className={cn("text-xs sm:text-sm font-mono font-semibold tracking-wider uppercase", archetypeColor)}>
              {archetypeLabel}
            </p>

            {room.archetype === "SILENT_FOCUS" && (
              <p className="text-crema-400 text-xs mt-3 bg-espresso-900/80 px-4 py-2 rounded-xl border border-espresso-700/80 leading-relaxed flex items-center justify-center gap-2">
                <AppIcon name="micOff" size={15} className="text-bourbon-400 shrink-0" />
                <span>{t("room_silent_notice")}</span>
              </p>
            )}

            {room.isLocked && (
              <div className="mt-3 flex flex-col items-center gap-2 max-w-xs w-full mx-auto">
                <div className="w-full px-3 py-1.5 bg-bourbon-950/60 border border-bourbon-500/40 rounded-xl text-bourbon-300 text-xs font-mono flex items-center justify-center gap-2">
                  <AppIcon name="lock" size={14} className="text-bourbon-400 shrink-0" />
                  <span>{language === "vi" ? "Phòng riêng tư (Yêu cầu mật khẩu)" : "Locked workstation (Password required)"}</span>
                </div>

                {!isRoomHost && (
                  <div className="w-full space-y-1 text-left">
                    <label className="text-[10px] font-mono uppercase tracking-wider text-crema-400 block text-center">
                      {language === "vi" ? "Nhập mật khẩu để vào:" : "Enter password to join:"}
                    </label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder={language === "vi" ? "Mật khẩu phòng..." : "Room password..."}
                      className="w-full px-3 py-2.5 bg-espresso-900 border border-espresso-700 rounded-xl text-crema-100 placeholder:text-crema-600 focus:outline-none focus:border-brass-500 text-center font-mono"
                      style={{ fontSize: "16px" }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleEnterRoom();
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Optional Study Intention Input */}
            <div className="w-full max-w-xs mx-auto space-y-1 text-left mt-3">
              <input
                type="text"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder={language === "vi" ? "🎯 Mục tiêu buổi học (ví dụ: 5 đề Toán)..." : "🎯 Study goal (e.g. 3 chapters)..."}
                className="w-full px-3 py-2.5 bg-espresso-900/80 border border-espresso-700/80 rounded-xl text-crema-100 placeholder:text-crema-600 focus:outline-none focus:border-brass-500 text-center font-mono transition-colors"
                style={{ fontSize: "16px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleEnterRoom();
                }}
              />
            </div>
          </div>

          {error && (
            <div className="px-4 py-2.5 bg-bourbon-700/30 border border-bourbon-500/50 rounded-xl text-bourbon-400 text-xs sm:text-sm max-w-sm text-center">
              {error}
            </div>
          )}

          <MotionButton
            variant="brass"
            size="lg"
            isLoading={isJoining}
            leftIcon={!isJoining ? <AppIcon name="videoOn" size={20} /> : undefined}
            onClick={handleEnterRoom}
            disabled={!user}
            className="px-8 shadow-lg shadow-brass-900/30"
          >
            <span>{isJoining ? t("room_connecting") : t("room_enter")}</span>
          </MotionButton>

          <p className="text-crema-600 text-xs font-mono hidden sm:block">
            {t("room_fullscreen_hint")}
          </p>
        </PageTransition>
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
          "flex items-center justify-between px-2.5 sm:px-4 py-1.5 sm:py-2 bg-espresso-900 border-b border-espresso-700/80 shrink-0 gap-1.5 sm:gap-2",
          isFullscreen && "opacity-0 hover:opacity-100 transition-opacity"
        )}
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
          <span className="font-mono text-xs text-brass-500 font-bold tracking-tight truncate hidden sm:inline shrink-0">
            {archetypeLabel}
          </span>
          <span className="text-espresso-700 hidden sm:inline shrink-0">|</span>
          <span className="text-crema-100 text-xs sm:text-sm font-semibold truncate max-w-[130px] xs:max-w-[200px] sm:max-w-none">
            {cleanTitle(room.name)}
          </span>
        </div>

        {/* Compact Pomodoro & Control Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {room.archetype === "AMBIENT_LOFI" ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-espresso-850 border border-brass-500/30 text-brass-400 text-xs font-mono select-none">
              <AppIcon name="coffee" size={13} />
              <span className="hidden sm:inline">Chill & Music</span>
            </div>
          ) : (
            <PomodoroTimer
              roomId={roomId as Id<"rooms">}
              serverId={serverId as Id<"servers">}
              canControl={canControlPomodoro}
              cadence={room.pomodoroCadence}
              compact
            />
          )}

          <button
            onClick={() => {
              setIsSoundscapeOpen((v) => !v);
              if (!isSoundscapeOpen) setIsChatOpen(false);
            }}
            className={cn(
              "p-2 rounded-lg transition-colors hidden sm:inline-flex",
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
              "p-2 rounded-lg transition-colors hidden sm:inline-flex",
              isSensoryFriendly
                ? "text-bourbon-400 bg-bourbon-500/20 border border-bourbon-500/40"
                : "text-crema-600 hover:text-crema-200 hover:bg-espresso-800"
            )}
            title={isSensoryFriendly ? t("sensory_mode_on") : t("sensory_mode_off")}
          >
            <AppIcon name="eye" size={17} />
          </button>

          {/* Host Lock / Unlock Button */}
          {isRoomHost && (
            <button
              onClick={handleToggleLock}
              className={cn(
                "flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-mono transition-colors",
                room.isLocked
                  ? "bg-bourbon-500/20 text-bourbon-300 border border-bourbon-500/40"
                  : "bg-patina-500/20 text-patina-300 border border-patina-500/40 hover:bg-patina-500/30"
              )}
              title={room.isLocked ? (language === "vi" ? "Phòng đang khóa" : "Room is Locked") : (language === "vi" ? "Phòng công khai" : "Room is Public")}
            >
              <AppIcon name={room.isLocked ? "lock" : "globe"} size={13} />
              <span className="hidden sm:inline">
                {room.isLocked ? (language === "vi" ? "Đã khóa" : "Locked") : (language === "vi" ? "Công khai" : "Public")}
              </span>
            </button>
          )}

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
            className="p-2 text-bourbon-500 hover:text-bourbon-400 hover:bg-espresso-800 rounded-lg transition-colors shrink-0"
            title={t("room_leave")}
          >
            <AppIcon name="logout" size={17} />
          </button>
        </div>
      </div>

      {/* ─── Integrated Study Goal Focus Bar ─── */}
      <div
        className={cn(
          "flex items-center justify-between px-2.5 sm:px-4 py-1.5 bg-espresso-950/95 border-b border-espresso-800/70 text-xs font-mono shrink-0 transition-opacity select-none",
          isFullscreen && "opacity-0 hover:opacity-100"
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className="text-sm shrink-0">🎯</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brass-400 shrink-0 hidden xs:inline">
            {language === "vi" ? "Mục tiêu:" : "Study Goal:"}
          </span>
          {isEditingIntention ? (
            <input
              type="text"
              autoFocus
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              onBlur={() => {
                setIsEditingIntention(false);
                updateMediaState({
                  roomId: roomId as Id<"rooms">,
                  currentIntention: intention.trim() || undefined,
                }).catch(() => {});
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsEditingIntention(false);
                  updateMediaState({
                    roomId: roomId as Id<"rooms">,
                    currentIntention: intention.trim() || undefined,
                  }).catch(() => {});
                }
              }}
              placeholder={language === "vi" ? "Nhập mục tiêu học tập (ví dụ: 5 đề Toán)..." : "Study goal (e.g. 5 math tests)..."}
              className="px-2 py-0.5 rounded bg-espresso-850 border border-brass-500/60 text-crema-100 text-xs font-mono w-full max-w-sm focus:outline-none"
              style={{ fontSize: "16px" }}
            />
          ) : (
            <button
              onClick={() => setIsEditingIntention(true)}
              className="flex items-center gap-1 text-left text-crema-200 hover:text-brass-300 transition-colors truncate group cursor-pointer min-w-0 flex-1"
              title={language === "vi" ? "Nhấp để đổi mục tiêu học tập" : "Click to edit study goal"}
            >
              <span className={cn("truncate text-xs font-medium", isGoalCompleted && "line-through text-crema-500")}>
                {intention.trim() || (language === "vi" ? "Chưa đặt mục tiêu — Nhấp để thêm" : "No goal set — Click to add")}
              </span>
              <AppIcon name="edit" size={11} className="text-crema-600 group-hover:text-brass-400 shrink-0 ml-0.5" />
            </button>
          )}
        </div>

        {intention.trim() && (
          <button
            onClick={() => setIsGoalCompleted((v) => !v)}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold transition-all shrink-0 ml-2 cursor-pointer",
              isGoalCompleted
                ? "bg-patina-500/20 text-patina-300 border border-patina-500/50"
                : "bg-espresso-850 text-crema-400 hover:text-crema-200 border border-espresso-700/80"
            )}
            title={isGoalCompleted ? (language === "vi" ? "Đã hoàn thành mục tiêu!" : "Goal completed!") : (language === "vi" ? "Đánh dấu hoàn thành" : "Mark as done")}
          >
            <AppIcon name="check" size={11} className={isGoalCompleted ? "text-patina-400" : "text-crema-500"} />
            <span>{isGoalCompleted ? (language === "vi" ? "Đã xong" : "Done") : (language === "vi" ? "Hoàn thành" : "Finish")}</span>
          </button>
        )}
      </div>

      {/* Center Video Grid Area with Drawers */}
      <div className="flex flex-1 overflow-hidden relative w-full">
        <div className="flex-1 overflow-hidden w-full h-full">
          <StudyVideoGrid
            roomId={roomId as Id<"rooms">}
            serverUrl={livekitUrl!}
            token={livekitToken}
            roomArchetype={room.archetype}
            isSensoryFriendly={isSensoryFriendly}
            isChatOpen={isChatOpen}
            onToggleChat={() => {
              setIsChatOpen((v) => !v);
            }}
            isSoundOpen={isSoundscapeOpen}
            onToggleSound={() => setIsSoundscapeOpen((v) => !v)}
            showDiagnosticHUD={showDiagnosticHUD}
            onCloseDiagnosticHUD={() => setShowDiagnosticHUD(false)}
            roomSlug={room.slug}
            onLeaveRoom={handleLeaveRoom}
          />
        </div>



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
