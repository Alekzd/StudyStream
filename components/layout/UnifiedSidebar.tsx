"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { cn, getArchetypeIcon, getArchetypeColor, cleanTitle } from "@/lib/utils";
import { AppIcon } from "@/components/ui/Icon";
import { CreateRoomModal } from "@/components/server/CreateRoomModal";
import { SidebarAudioWidget } from "@/components/soundscape/SidebarAudioWidget";
import { SkeletonPulse } from "@/components/ui/motion";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/context/LanguageContext";

export function UnifiedSidebar() {
  const { language } = useLanguage();
  const isVi = language === "vi";

  const rooms = useQuery(api.rooms.getAllRooms);
  const regionalServers = useQuery(api.servers.getRegionalServers);
  const currentUser = useQuery(api.users.getCurrentUser);
  const seedDefaultRooms = useMutation(api.rooms.seedDefaultRooms);
  const router = useRouter();
  const pathname = usePathname();

  const [filterArchetype, setFilterArchetype] = useState<string>("ALL");
  const [activeServerId, setActiveServerId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("studystream_active_server_id") || "ALL";
    }
    return "ALL";
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("studystream_sidebar_collapsed") === "true";
    }
    return false;
  });

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("studystream_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  // Auto-seed default lively rooms if platform has fewer than 3 rooms
  useEffect(() => {
    if (rooms !== undefined && rooms.length < 3) {
      seedDefaultRooms().catch(() => {});
    }
  }, [rooms, seedDefaultRooms]);

  const currentServer = regionalServers?.find((s) => s._id === activeServerId);
  const serverBadgeLabel = currentServer ? cleanTitle(currentServer.name) : (isVi ? "Tất Cả Khu Vực" : "All Regions");

  // Check if current server has rooms
  const roomsInCurrentServer = rooms?.filter((r) => activeServerId === "ALL" || r.serverId === activeServerId) ?? [];
  const isFallingBackToAll = activeServerId !== "ALL" && roomsInCurrentServer.length === 0;

  // Base list: server-specific if available, otherwise all platform rooms sorted by crowded/active first
  const baseRooms = isFallingBackToAll ? (rooms ?? []) : roomsInCurrentServer;

  // Filter by archetype if requested
  const filteredRooms = baseRooms.filter((r) => {
    if (filterArchetype !== "ALL" && r.archetype !== filterArchetype) return false;
    return true;
  });

  // Final display list: if archetype filter is empty, fallback to all available rooms
  const displayRooms = filteredRooms.length > 0 ? filteredRooms : baseRooms;

  return (
    <aside
      className={cn(
        "flex flex-col bg-espresso-900 border-r border-espresso-750/90 h-full shrink-0 select-none overflow-hidden text-crema-100 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64 md:w-68 lg:w-72"
      )}
    >
      {/* 1. Brand & Atelier Header */}
      {isCollapsed ? (
        <div className="flex flex-col items-center gap-2 py-3 border-b border-espresso-750/80 bg-espresso-900/90 shrink-0 px-2">
          <Link
            href="/explore"
            className="w-9 h-9 rounded-xl bg-espresso-850 hover:bg-espresso-800 border border-espresso-700 flex items-center justify-center text-brass-400 hover:text-brass-300 transition-colors shadow-sm shrink-0 cursor-pointer"
            title="StudyStream Explore"
            aria-label="Explore"
          >
            <AppIcon name="coffee" size={18} />
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            className="w-8 h-8 rounded-lg bg-espresso-850 hover:bg-brass-500 hover:text-espresso-950 text-brass-400 border border-espresso-700/80 flex items-center justify-center transition-all shadow-sm cursor-pointer"
            title={isVi ? "Mở rộng thanh bên (Expand)" : "Expand sidebar"}
            aria-label="Expand sidebar"
          >
            <AppIcon name="chevronRight" size={15} />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between px-3.5 py-3 border-b border-espresso-750/80 bg-espresso-900/90 shrink-0">
          <div className="flex items-center gap-2.5 text-left min-w-0">
            <Link
              href="/explore"
              className="w-8 h-8 rounded-xl bg-espresso-850 hover:bg-espresso-800 border border-espresso-700 flex items-center justify-center text-brass-400 hover:text-brass-300 transition-colors shadow-sm shrink-0 cursor-pointer"
              title="Go to Explore Workstations"
              aria-label="Go to Explore Workstations"
            >
              <AppIcon name="coffee" size={17} />
            </Link>
            <div className="min-w-0">
              <Link
                href="/explore"
                className="font-bold text-sm text-crema-100 hover:text-brass-300 tracking-tight leading-none transition-colors font-sans text-left block truncate cursor-pointer"
              >
                StudyStream
              </Link>
              <div className="text-[10px] font-mono text-patina-400 mt-1 truncate flex items-center gap-1">
                <AppIcon name="globe" size={10} className="shrink-0 text-patina-400" />
                <span className="truncate">{serverBadgeLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <CreateRoomModal
              serverId={activeServerId !== "ALL" ? (activeServerId as Id<"servers">) : undefined}
              onCreated={(roomId) => {
                const room = rooms?.find(r => r._id === roomId);
                if (room) {
                  router.push(`/servers/${room.serverId}/rooms/${room._id}`);
                }
              }}
            >
              <button
                className="w-7 h-7 rounded-lg bg-espresso-850 hover:bg-brass-500 hover:text-espresso-950 text-crema-400 border border-espresso-700/80 flex items-center justify-center transition-all shadow-sm cursor-pointer"
                title="Create new room"
                aria-label="Create new room"
              >
                <AppIcon name="plus" size={14} />
              </button>
            </CreateRoomModal>

            {/* Retract Sidebar Button */}
            <button
              type="button"
              onClick={toggleCollapsed}
              className="w-7 h-7 rounded-lg bg-espresso-850 hover:bg-espresso-800 text-crema-400 hover:text-brass-300 border border-espresso-700/80 flex items-center justify-center transition-all shadow-sm cursor-pointer"
              title={isVi ? "Thu gọn thanh bên (Retract)" : "Collapse sidebar"}
              aria-label="Collapse sidebar"
            >
              <AppIcon name="chevronLeft" size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Navigation Links */}
      {isCollapsed ? (
        <div className="flex flex-col items-center gap-1.5 py-2 shrink-0 px-2">
          <Link
            href="/explore"
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer",
              pathname === "/explore" || pathname === "/"
                ? "bg-brass-500/20 text-brass-300 border border-brass-500/40 font-semibold shadow-sm"
                : "text-crema-400 hover:bg-espresso-850 hover:text-crema-100 border border-transparent"
            )}
            title={isVi ? "Khám Phá Phòng" : "Explore"}
          >
            <AppIcon name="compass" size={17} />
          </Link>
          <Link
            href="/profile"
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors relative cursor-pointer",
              pathname === "/profile"
                ? "bg-bourbon-500/20 text-bourbon-400 border border-bourbon-500/40 font-semibold shadow-sm"
                : "text-crema-400 hover:bg-espresso-850 hover:text-crema-100 border border-transparent"
            )}
            title={`${isVi ? "Thống Kê" : "Stats"}${currentUser ? ` (${currentUser.streakCount}d streak)` : ""}`}
          >
            <AppIcon name="flame" size={17} className="text-bourbon-400" />
            {currentUser && currentUser.streakCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-bourbon-400 animate-pulse" />
            )}
          </Link>
        </div>
      ) : (
        <div className="px-2.5 pt-2.5 pb-1.5 flex flex-col gap-1 shrink-0">
          <Link
            href="/explore"
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer",
              pathname === "/explore" || pathname === "/"
                ? "bg-brass-500/20 text-brass-300 border border-brass-500/40 font-semibold"
                : "text-crema-400 hover:bg-espresso-850 hover:text-crema-100"
            )}
          >
            <AppIcon name="compass" size={15} />
            <span className="flex-1">{isVi ? "Khám Phá Phòng" : "Explore"}</span>
          </Link>

          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer",
              pathname === "/profile"
                ? "bg-bourbon-500/20 text-bourbon-400 border border-bourbon-500/40 font-semibold"
                : "text-crema-400 hover:bg-espresso-850 hover:text-crema-100"
            )}
          >
            <AppIcon name="flame" size={15} className="text-bourbon-400" />
            <span className="flex-1">{isVi ? "Thống Kê" : "Stats"}</span>
            {currentUser && (
              <span className="text-[10px] font-mono font-bold text-bourbon-400 bg-bourbon-500/15 px-1.5 py-0.5 rounded">
                {currentUser.streakCount}d
              </span>
            )}
          </Link>
        </div>
      )}

      {/* 3. Room Directory Header & Filter (Only when expanded) */}
      {!isCollapsed && (
        <div className="px-3 pt-2 pb-1 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold text-crema-600 uppercase tracking-wider">
              {isVi ? "Phòng Học" : "Rooms"}
            </span>
            {rooms && (
              <span className="text-[10px] font-mono text-crema-600">
                ({rooms.length})
              </span>
            )}
          </div>

          <select
            value={filterArchetype}
            onChange={(e) => setFilterArchetype(e.target.value)}
            className="bg-espresso-850 text-crema-400 text-[10px] font-mono rounded px-1 py-0.5 border border-espresso-750 focus:outline-none"
            aria-label="Filter by room archetype"
          >
            <option value="ALL">{isVi ? "Tất Cả Loại" : "All Types"}</option>
            <option value="SILENT_FOCUS">{isVi ? "Chỉ Bật Cam" : "Only Cam"}</option>
            <option value="SYNC_POMODORO">{isVi ? "Pomo Chung" : "Pomodoro"}</option>
            <option value="AMBIENT_LOFI">{isVi ? "Phòng Chill" : "Chill & Music"}</option>
            <option value="CAM_ACCOUNTABILITY">{isVi ? "Kỷ Luật Cam" : "Cam Enforced"}</option>
            <option value="PAIR_SCREENSHARE">{isVi ? "Share Màn Hình" : "Screenshare"}</option>
            <option value="SANDBOX_TEST">{isVi ? "Test Thiết Bị" : "Sandbox"}</option>
          </select>
        </div>
      )}

      {/* 4. Active Rooms List (Scrollable) */}
      <div className={cn("flex-1 overflow-y-auto px-2 py-1 space-y-1", isCollapsed && "flex flex-col items-center")}>
        {rooms === undefined ? (
          <div className="space-y-1.5 p-1 w-full">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonPulse key={i} className={cn("bg-espresso-850/80 rounded-lg", isCollapsed ? "h-10 w-10 mx-auto" : "h-8 w-full")} />
            ))}
          </div>
        ) : displayRooms?.length === 0 ? (
          !isCollapsed ? (
            <div className="py-6 px-3 text-center flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-espresso-850 flex items-center justify-center text-crema-600">
                <AppIcon name="coffee" size={16} />
              </div>
              <p className="text-xs text-crema-400 font-sans">
                {isVi ? "Chưa có phòng học nào." : "No study rooms yet."}
              </p>
              <CreateRoomModal onCreated={(roomId) => {
                const room = rooms?.find(r => r._id === roomId);
                if (room) router.push(`/servers/${room.serverId}/rooms/${room._id}`);
              }}>
                <span className="text-[11px] font-medium text-brass-400 hover:text-brass-300 underline cursor-pointer">
                  {isVi ? "Tạo trạm học đầu tiên" : "Create the first workstation"}
                </span>
              </CreateRoomModal>
            </div>
          ) : null
        ) : (
          <>
            {isFallingBackToAll && !isCollapsed && (
              <div className="px-2 py-1 mb-1.5 bg-espresso-850/80 rounded-lg border border-espresso-750/70 text-[10px] font-mono text-brass-400/90 flex items-center justify-between">
                <span>{isVi ? "Phòng sôi động toàn hệ thống:" : "Active Campus Rooms:"}</span>
                <AppIcon name="flame" size={12} className="text-bourbon-400 shrink-0" />
              </div>
            )}
            {displayRooms?.map((room) => {
              const isActive = pathname.includes(`/rooms/${room._id}`);

              if (isCollapsed) {
                return (
                  <Link
                    key={room._id}
                    href={`/servers/${room.serverId}/rooms/${room._id}`}
                    className={cn(
                      "relative w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer",
                      isActive
                        ? "bg-espresso-800 text-brass-300 border border-brass-500/50 shadow-sm"
                        : "text-crema-400 hover:bg-espresso-850 hover:text-crema-100 border border-transparent"
                    )}
                    title={`${cleanTitle(room.name)} (${room.pomodoroCadence || "50/10"})${room.participantCount > 0 ? ` • ${room.participantCount} online` : ""}`}
                  >
                    {room.isLocked ? (
                      <AppIcon name="lock" size={15} className="text-bourbon-400 shrink-0" />
                    ) : (
                      <AppIcon
                        name={getArchetypeIcon(room.archetype)}
                        size={16}
                        className={cn(getArchetypeColor(room.archetype), "shrink-0")}
                      />
                    )}
                    {room.participantCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-bourbon-500 text-crema-50 text-[9px] font-mono font-bold flex items-center justify-center border border-espresso-950">
                        {room.participantCount}
                      </span>
                    )}
                  </Link>
                );
              }

              return (
                <Link
                  key={room._id}
                  href={`/servers/${room.serverId}/rooms/${room._id}`}
                  className={cn(
                    "group flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer",
                    isActive
                      ? "bg-espresso-800 text-brass-300 font-semibold border border-brass-500/40 shadow-sm"
                      : "text-crema-400 hover:bg-espresso-850 hover:text-crema-200 border border-transparent"
                  )}
                >
                  {/* Lock or Archetype icon */}
                  {room.isLocked ? (
                    <AppIcon name="lock" size={13} className="text-bourbon-400 shrink-0" />
                  ) : (
                    <AppIcon
                      name={getArchetypeIcon(room.archetype)}
                      size={14}
                      className={cn(getArchetypeColor(room.archetype), "shrink-0")}
                    />
                  )}

                  <span className="truncate flex-1 font-sans text-xs">
                    {cleanTitle(room.name)}
                  </span>

                  {/* Cadence Tag */}
                  <span className="text-[9px] font-mono text-brass-400/80 bg-espresso-850/80 px-1 py-0.5 rounded border border-espresso-750/70 shrink-0">
                    {room.pomodoroCadence || "50/10"}
                  </span>

                  {/* Participant / Crowded status */}
                  {room.participantCount > 0 ? (
                    <span className="flex items-center gap-1 text-[10px] text-bourbon-400 font-mono font-bold shrink-0 bg-bourbon-500/15 border border-bourbon-500/30 px-1.5 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-bourbon-400 animate-pulse" />
                      <span>{room.participantCount}</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-crema-600 font-mono shrink-0">
                      24/7
                    </span>
                  )}
                </Link>
              );
            })}
          </>
        )}
      </div>

      {/* 5. Minimalist Sidebar Audio Soundscape */}
      <div className={cn("border-t border-espresso-750/80 bg-espresso-900/60 shrink-0", isCollapsed ? "p-2 flex justify-center" : "px-2.5 py-2")}>
        <SidebarAudioWidget compact={isCollapsed} />
      </div>

      {/* 6. User Profile & Settings Footer */}
      {isCollapsed ? (
        <div className="py-2.5 border-t border-espresso-750/80 bg-espresso-900 flex flex-col items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="w-8 h-8 flex items-center justify-center text-crema-400 hover:text-brass-300 hover:bg-espresso-800 rounded-lg transition-colors border border-transparent hover:border-espresso-750 cursor-pointer"
            title="Settings"
            aria-label="Open settings"
          >
            <AppIcon name="settings" size={16} />
          </button>
          <UserButton />
        </div>
      ) : (
        <div className="px-3 py-2.5 border-t border-espresso-750/80 bg-espresso-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <UserButton />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-crema-100 truncate font-sans">
                {currentUser?.name ?? "Scholar"}
              </div>
              <div className="text-[10px] font-mono text-crema-400 truncate">
                {currentUser?.totalFocusMinutes ?? 0}m focus
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 text-crema-400 hover:text-brass-300 hover:bg-espresso-800 rounded-lg transition-colors border border-transparent hover:border-espresso-750 cursor-pointer"
              title="Settings"
              aria-label="Open settings"
            >
              <AppIcon name="settings" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal (Country Servers & Cadence) */}
      <SettingsModal
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onRegionChange={(id) => setActiveServerId(id)}
      />
    </aside>
  );
}
