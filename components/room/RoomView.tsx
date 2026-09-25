"use client";

import { useState, useEffect } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { StudyVideoGrid } from "./StudyVideoGrid";
import { PomodoroTimer } from "@/components/pomodoro/PomodoroTimer";
import { ChatDrawer } from "./ChatDrawer";
import { getArchetypeLabel, cn, cleanTitle } from "@/lib/utils";
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

export interface StudyTask {
  id: string;
  text: string;
  completed: boolean;
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

  const [localToken, setLocalToken] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(`studystream_lk_token_${roomId}`);
    }
    return null;
  });
  const [localUrl, setLocalUrl] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(`studystream_lk_url_${roomId}`);
    }
    return null;
  });

  // Derived token & url: immediately active if user is returning to their active room session
  const livekitToken = isCurrentActiveRoom
    ? (activeRoom?.livekitToken || localToken)
    : activeRoom
    ? null
    : localToken;
  const livekitUrl = isCurrentActiveRoom
    ? (activeRoom?.livekitUrl || localUrl)
    : activeRoom
    ? null
    : localUrl;

  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSoundscapeOpen, setIsSoundscapeOpen] = useState(false);
  const [isSensoryFriendly, setIsSensoryFriendly] = useState(false);
  const [showDiagnosticHUD, setShowDiagnosticHUD] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [passwordInput, setPasswordInput] = useState("");
  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`studystream_tasks_${roomId}`);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });
  const [isTaskListOpen, setIsTaskListOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");

  const syncTaskIntention = (updatedTasks: StudyTask[]) => {
    setTasks(updatedTasks);
    try {
      localStorage.setItem(`studystream_tasks_${roomId}`, JSON.stringify(updatedTasks));
    } catch {}

    const uncompleted = updatedTasks.find((t) => !t.completed);
    const completedCount = updatedTasks.filter((t) => t.completed).length;
    const totalCount = updatedTasks.length;

    let intentionStr: string | undefined = undefined;
    if (totalCount > 0) {
      if (uncompleted) {
        intentionStr =
          totalCount > 1
            ? `${uncompleted.text} [${completedCount}/${totalCount}]`
            : uncompleted.text;
      } else {
        intentionStr = `✓ ${language === "vi" ? "Hoàn thành tất cả" : "All goals done"} [${totalCount}/${totalCount}]`;
      }
    }

    updateMediaState({
      roomId: roomId as Id<"rooms">,
      currentIntention: intentionStr,
    }).catch(() => {});
  };

  const handleAddTask = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newTask: StudyTask = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 5),
      text: trimmed,
      completed: false,
    };
    const updated = [...tasks, newTask];
    syncTaskIntention(updated);
    setNewTaskText("");
  };

  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    syncTaskIntention(updated);
  };

  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    syncTaskIntention(updated);
  };

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

      const currentTasks = tasks;
      const activeTask = currentTasks.find((t) => !t.completed);
      const initialIntention =
        currentTasks.length > 0
          ? activeTask
            ? currentTasks.length > 1
              ? `${activeTask.text} [0/${currentTasks.length}]`
              : activeTask.text
            : `✓ ${language === "vi" ? "Hoàn thành tất cả" : "All goals done"}`
          : undefined;

      await joinRoom({
        roomId: roomId as Id<"rooms">,
        serverId: serverId as Id<"servers">,
        liveKitIdentity: user.id,
        currentIntention: initialIntention,
        password: passwordInput.trim() || undefined,
      });

      setLocalToken(token);
      setLocalUrl(serverUrl);
      try {
        sessionStorage.setItem(`studystream_lk_token_${roomId}`, token);
        sessionStorage.setItem(`studystream_lk_url_${roomId}`, serverUrl);
      } catch {}

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

  // Auto-connect into room seamlessly (skip redundant pre-join lobby)
  useEffect(() => {
    if (!room || !user || !currentUser) return;
    if (livekitToken || isJoining || error) return;

    // Restraint: Do NOT auto-join if user is already active in a DIFFERENT room!
    if (activeRoom && !isCurrentActiveRoom) {
      return;
    }

    // Only hold if room is password-locked and user is not host and not already active
    if (room.isLocked && !isRoomHost && !isCurrentActiveRoom && !passwordInput.trim()) {
      return;
    }

    const timer = setTimeout(() => {
      handleEnterRoom();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, user, currentUser, livekitToken, isJoining, error, isRoomHost, isCurrentActiveRoom, activeRoom]);

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
      sessionStorage.removeItem(`studystream_lk_token_${roomId}`);
      sessionStorage.removeItem(`studystream_lk_url_${roomId}`);
    } catch {}
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

  const archetypeLabel = getArchetypeLabel(room.archetype, language);

  // Restraint Guard: If user is active in a DIFFERENT room, require explicit confirmation before switching!
  if (activeRoom && !isCurrentActiveRoom) {
    return (
      <BannerBackground opacity={0.4}>
        <PageTransition className="flex flex-col items-center justify-center flex-1 h-full px-4 sm:px-8 py-8 gap-5 text-center select-none">
          <div className="w-14 h-14 rounded-2xl bg-espresso-900 border border-bourbon-500/50 flex items-center justify-center text-bourbon-400 shadow-xl">
            <AppIcon name="logout" size={28} />
          </div>

          <div className="max-w-md w-full space-y-2">
            <h1 className="text-xl font-bold text-crema-100 font-sans tracking-tight">
              {language === "vi" ? "Đang trong phòng học khác" : "Active In Another Room"}
            </h1>
            <p className="text-xs text-crema-400 font-mono leading-relaxed">
              {language === "vi"
                ? `Bạn đang tham gia phòng "${cleanTitle(activeRoom.roomName)}". Bạn có muốn rời phòng cũ để chuyển sang "${cleanTitle(room.name)}" không?`
                : `You are currently in "${cleanTitle(activeRoom.roomName)}". Do you want to leave it and switch to "${cleanTitle(room.name)}"?`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full max-w-xs">
            <button
              type="button"
              onClick={() => router.push(`/servers/${activeRoom.serverId}/rooms/${activeRoom.roomId}`)}
              className="w-full py-2 px-3 rounded-xl bg-espresso-850 hover:bg-espresso-800 text-crema-200 border border-espresso-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              {language === "vi" ? `← Quay lại ${cleanTitle(activeRoom.roomName)}` : `← Return to ${cleanTitle(activeRoom.roomName)}`}
            </button>
            <MotionButton
              variant="brass"
              size="md"
              isLoading={isJoining}
              onClick={async () => {
                await leaveRoom({ roomId: activeRoom.roomId as Id<"rooms"> }).catch(() => {});
                handleEnterRoom();
              }}
              className="w-full text-xs font-semibold shadow-md cursor-pointer"
            >
              <span>{language === "vi" ? "Rời & Chuyển phòng" : "Leave & Switch"}</span>
            </MotionButton>
          </div>
        </PageTransition>
      </BannerBackground>
    );
  }

  // Seamless Connection & Password Check (Skips redundant pre-join lobby)
  if (!livekitToken) {
    if (room.isLocked && !isRoomHost && !isCurrentActiveRoom) {
      return (
        <BannerBackground opacity={0.4}>
          <PageTransition className="flex flex-col items-center justify-center flex-1 h-full px-4 sm:px-8 py-8 gap-5 text-center select-none">
            <div className="w-14 h-14 rounded-2xl bg-espresso-900 border border-bourbon-500/50 flex items-center justify-center text-bourbon-400 shadow-xl">
              <AppIcon name="lock" size={28} />
            </div>

            <div className="max-w-xs w-full space-y-3">
              <h1 className="text-xl font-bold text-crema-100 font-sans tracking-tight">
                {cleanTitle(room.name)}
              </h1>
              <p className="text-xs text-bourbon-300 font-mono">
                {language === "vi" ? "Phòng khóa • Cần mật khẩu để tham gia" : "Locked room • Password required"}
              </p>

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
                autoFocus
              />

              {error && (
                <div className="px-3 py-1.5 bg-bourbon-950/70 border border-bourbon-500/50 rounded-xl text-bourbon-400 text-xs text-center font-mono">
                  {error}
                </div>
              )}

              <MotionButton
                variant="brass"
                size="md"
                isLoading={isJoining}
                onClick={handleEnterRoom}
                className="w-full shadow-md cursor-pointer"
              >
                <span>{language === "vi" ? "Vào phòng" : "Join Room"}</span>
              </MotionButton>
            </div>
          </PageTransition>
        </BannerBackground>
      );
    }

    // Auto-connecting seamless state
    return (
      <BannerBackground opacity={0.4}>
        <div className="flex flex-col items-center justify-center flex-1 h-full gap-4 text-center select-none">
          <AtelierLoader />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-crema-100">
              {cleanTitle(room.name)}
            </h2>
            <p className="text-xs font-mono text-crema-400 animate-pulse">
              {language === "vi" ? "Đang kết nối vào phòng học..." : "Connecting to study room..."}
            </p>
          </div>
          {error && (
            <div className="mt-2 text-xs text-bourbon-400 bg-bourbon-950/60 px-3 py-1.5 rounded-lg border border-bourbon-500/40 flex items-center gap-2">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  handleEnterRoom();
                }}
                className="underline font-semibold text-crema-200 cursor-pointer"
              >
                {language === "vi" ? "Thử lại" : "Retry"}
              </button>
            </div>
          )}
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

      {/* ─── Integrated Study Goals & Task List Bar ─── */}
      <div
        className={cn(
          "relative flex items-center justify-between px-2.5 sm:px-4 py-1.5 bg-espresso-950/95 border-b border-espresso-800/70 text-xs font-mono shrink-0 transition-opacity select-none z-30",
          isFullscreen && "opacity-0 hover:opacity-100"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <AppIcon name="target" size={14} className="text-brass-400 shrink-0" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brass-400 shrink-0 hidden xs:inline">
            {language === "vi" ? "Mục tiêu:" : "Study Goals:"}
          </span>

          <button
            type="button"
            onClick={() => setIsTaskListOpen((v) => !v)}
            className="flex items-center gap-1.5 text-left text-crema-200 hover:text-brass-300 transition-colors truncate group cursor-pointer min-w-0 flex-1 py-0.5"
            title={language === "vi" ? "Mở danh sách mục tiêu" : "Open task list"}
          >
            {tasks.length > 0 ? (
              <span className="truncate flex items-center gap-2">
                <span className={cn("truncate text-xs font-medium", tasks.every((t) => t.completed) && "line-through text-patina-400")}>
                  {tasks.find((t) => !t.completed)?.text || (language === "vi" ? "✓ Đã hoàn thành mọi mục tiêu!" : "✓ All goals completed!")}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-espresso-850 border border-espresso-700/80 text-brass-400 font-bold shrink-0">
                  {tasks.filter((t) => t.completed).length}/{tasks.length}
                </span>
              </span>
            ) : (
              <span className="text-xs text-crema-500 italic flex items-center gap-1 group-hover:text-brass-400">
                <span>{language === "vi" ? "Chưa có mục tiêu — Nhấp để thêm" : "No goals set — Click to add"}</span>
                <AppIcon name="plus" size={11} className="shrink-0" />
              </span>
            )}
            <AppIcon name="edit" size={11} className="text-crema-600 group-hover:text-brass-400 shrink-0 ml-0.5" />
          </button>
        </div>

        {/* Quick Done / Manage Button */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {tasks.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const uncompleted = tasks.find((t) => !t.completed);
                if (uncompleted) {
                  handleToggleTask(uncompleted.id);
                } else if (tasks.length > 0) {
                  handleToggleTask(tasks[0].id);
                }
              }}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold transition-all shrink-0 cursor-pointer",
                tasks.every((t) => t.completed)
                  ? "bg-patina-500/20 text-patina-300 border border-patina-500/50"
                  : "bg-espresso-850 text-crema-400 hover:text-crema-200 border border-espresso-700/80"
              )}
              title={tasks.every((t) => t.completed) ? (language === "vi" ? "Mọi mục tiêu đã hoàn thành!" : "All tasks finished!") : (language === "vi" ? "Đánh dấu xong mục tiêu hiện tại" : "Complete current task")}
            >
              <AppIcon name="check" size={11} className={tasks.every((t) => t.completed) ? "text-patina-400" : "text-crema-500"} />
              <span>{tasks.every((t) => t.completed) ? (language === "vi" ? "Đã xong" : "Done") : (language === "vi" ? "Xong việc này" : "Mark done")}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsTaskListOpen((v) => !v)}
            className={cn(
              "px-2 py-0.5 rounded-md text-[10px] font-mono font-medium transition-colors flex items-center gap-1 cursor-pointer",
              isTaskListOpen
                ? "bg-brass-500 text-espresso-950 font-bold"
                : "bg-espresso-900 hover:bg-espresso-850 text-crema-300 border border-espresso-750"
            )}
          >
            <AppIcon name="list" size={11} />
            <span>{language === "vi" ? "Danh sách" : "Task List"}</span>
          </button>
        </div>

        {/* ── Popover: Task List Dropdown ── */}
        {isTaskListOpen && (
          <div className="absolute top-full left-2 sm:left-4 mt-1 w-80 sm:w-96 max-w-[calc(100vw-2rem)] p-3 rounded-2xl bg-espresso-900/98 border border-brass-500/50 shadow-2xl backdrop-blur-md z-50 flex flex-col gap-2.5 animate-pip-in">
            <div className="flex items-center justify-between pb-1 border-b border-espresso-750/80">
              <div className="flex items-center gap-1.5 text-brass-400 font-bold text-xs">
                <AppIcon name="target" size={14} />
                <span>{language === "vi" ? "Danh Sách Mục Tiêu" : "Study Task List"}</span>
                {tasks.length > 0 && (
                  <span className="text-[10px] font-mono text-crema-400 font-normal">
                    ({tasks.filter((t) => t.completed).length}/{tasks.length})
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsTaskListOpen(false)}
                className="w-5 h-5 rounded-md flex items-center justify-center text-crema-500 hover:text-crema-200 transition-colors cursor-pointer"
              >
                <AppIcon name="close" size={12} />
              </button>
            </div>

            {/* Quick Add Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddTask(newTaskText);
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder={language === "vi" ? "Thêm mục tiêu mới (Enter)..." : "Add new task (press Enter)..."}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-espresso-950 border border-espresso-750 text-crema-100 text-xs placeholder:text-crema-600 focus:outline-none focus:border-brass-500 font-mono"
                style={{ fontSize: "16px" }}
              />
              <button
                type="submit"
                disabled={!newTaskText.trim()}
                className="px-2.5 py-1.5 rounded-lg bg-brass-500 hover:bg-brass-600 disabled:opacity-40 text-espresso-950 text-xs font-mono font-bold transition-all shrink-0 cursor-pointer"
              >
                {language === "vi" ? "Thêm" : "Add"}
              </button>
            </form>

            {/* Tasks Scrollable List */}
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
              {tasks.length === 0 ? (
                <div className="text-center py-4 text-xs text-crema-600 italic">
                  {language === "vi" ? "Chưa có mục tiêu nào. Hãy thêm mục tiêu đầu tiên!" : "No tasks added yet. Add your first goal above!"}
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-espresso-850/80 border border-transparent hover:border-espresso-750/70 transition-colors group"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task.id)}
                      className="flex items-center gap-2 text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors",
                          task.completed
                            ? "bg-patina-500 border-patina-400 text-espresso-950"
                            : "border-espresso-600 group-hover:border-brass-400"
                        )}
                      >
                        {task.completed && <AppIcon name="check" size={10} />}
                      </div>
                      <span
                        className={cn(
                          "text-xs truncate transition-all",
                          task.completed ? "line-through text-crema-600" : "text-crema-200"
                        )}
                      >
                        {task.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(task.id)}
                      className="w-5 h-5 rounded flex items-center justify-center text-crema-600 hover:text-bourbon-400 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title={language === "vi" ? "Xóa mục tiêu này" : "Delete task"}
                    >
                      <AppIcon name="trash" size={11} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Clear completed button */}
            {tasks.some((t) => t.completed) && (
              <div className="flex justify-end pt-1 border-t border-espresso-800/80">
                <button
                  type="button"
                  onClick={() => {
                    const activeOnly = tasks.filter((t) => !t.completed);
                    syncTaskIntention(activeOnly);
                  }}
                  className="text-[10px] text-crema-500 hover:text-crema-300 font-mono transition-colors cursor-pointer"
                >
                  {language === "vi" ? "Xóa các mục đã xong" : "Clear completed"}
                </button>
              </div>
            )}
          </div>
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
