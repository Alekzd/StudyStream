"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useActiveRoom } from "@/context/ActiveRoomContext";
import { AppIcon } from "@/components/ui/Icon";
import { getArchetypeLabel, getArchetypeIcon, getArchetypeColor, cleanTitle } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

export function RoomPiPDock() {
  const { activeRoom, leaveActiveRoom } = useActiveRoom();
  const pathname = usePathname();
  const { language } = useLanguage();
  const isVi = language === "vi";

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [now, setNow] = useState<number>(() => Date.now());

  // Update clock tick for elapsed timer
  useEffect(() => {
    if (!activeRoom) return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [activeRoom]);

  const elapsedSecs = activeRoom
    ? Math.max(0, Math.floor((now - (activeRoom.joinedAt || now)) / 1000))
    : 0;

  // If no room is active, or user is already inside the room's full view page, don't show the PiP dock
  if (!activeRoom) return null;
  const isInRoomPage = pathname.includes(`/rooms/${activeRoom.roomId}`);
  if (isInRoomPage) return null;

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60).toString().padStart(2, "0");
    const s = (totalSecs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleExit = async () => {
    await leaveActiveRoom();
  };

  if (isCollapsed) {
    /* ─── Collapsed Floating Pill Badge ─── */
    return (
      <div
        className="fixed right-4 z-50 select-none animate-pip-in flex items-center gap-2 px-3 py-2 rounded-full bg-espresso-900/95 border border-brass-500/60 shadow-2xl backdrop-blur-md"
        style={{ bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 4.5rem))" }}
        role="complementary"
        aria-label="Active Room Mini Pill"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-patina-400 animate-pulse shrink-0" />
        <Link
          href={`/servers/${activeRoom.serverId}/rooms/${activeRoom.roomId}`}
          className="text-xs font-semibold text-crema-100 hover:text-brass-300 transition-colors flex items-center gap-1.5 truncate max-w-[140px] cursor-pointer"
          title="Return to room"
        >
          <span className="truncate">{cleanTitle(activeRoom.roomName)}</span>
          <span className="text-[10px] font-mono text-brass-400 tabular-nums">
            {formatTimer(elapsedSecs)}
          </span>
        </Link>

        <div className="w-[1px] h-3.5 bg-espresso-750" />

        {/* Expand full PiP button */}
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="text-crema-400 hover:text-crema-100 p-1 rounded transition-colors cursor-pointer"
          title="Expand mini-player"
          aria-label="Expand mini-player"
        >
          <AppIcon name="expand" size={13} />
        </button>

        {/* Exit button */}
        <button
          type="button"
          onClick={handleExit}
          className="w-6 h-6 rounded-full flex items-center justify-center bg-bourbon-500/20 text-bourbon-400 hover:bg-bourbon-500/30 transition-colors cursor-pointer"
          title={isVi ? "Rời phòng" : "Leave Room"}
          aria-label="Leave Room"
        >
          <AppIcon name="logout" size={12} />
        </button>
      </div>
    );
  }

  /* ─── Full Floating PiP Room Mini-Player Card ─── */
  return (
    <div
      className="fixed right-4 z-50 select-none w-76 sm:w-80 p-3.5 rounded-2xl bg-espresso-900/95 border border-brass-500/50 shadow-2xl backdrop-blur-md animate-pip-in flex flex-col gap-2.5 transition-spring"
      style={{ bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 4.5rem))" }}
      role="complementary"
      aria-label="Active Room Mini Player"
    >
      {/* ─── Top Status Bar ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-patina-400 animate-pulse" />
          <span className="text-[11px] font-mono font-semibold text-patina-300 uppercase tracking-wider">
            {isVi ? "Đang Trong Phòng" : "Active In Room"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Collapse to pill button */}
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="text-crema-500 hover:text-crema-200 p-1 rounded transition-colors cursor-pointer"
            title="Minimize to floating pill"
            aria-label="Minimize"
          >
            <AppIcon name="minimize" size={14} />
          </button>
        </div>
      </div>

      {/* ─── Room Identity & Focus Stats ─── */}
      <div className="bg-espresso-850/70 border border-espresso-750/80 rounded-xl p-2.5 flex items-center justify-between">
        <div className="min-w-0 pr-2">
          <div className="font-bold text-xs text-crema-100 truncate">
            {cleanTitle(activeRoom.roomName)}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <AppIcon
              name={getArchetypeIcon(activeRoom.roomArchetype)}
              size={12}
              className={getArchetypeColor(activeRoom.roomArchetype)}
            />
            <span className="text-[10px] font-mono text-crema-400 truncate">
              {getArchetypeLabel(activeRoom.roomArchetype)}
            </span>
          </div>
        </div>

        {/* Live Elapsed Stopwatch */}
        <div className="text-right shrink-0">
          <div className="text-xs font-mono font-bold text-brass-300 tabular-nums">
            {formatTimer(elapsedSecs)}
          </div>
          <div className="text-[9px] font-mono text-crema-500 uppercase">
            {isVi ? "Thời gian học" : "Session time"}
          </div>
        </div>
      </div>

      {/* ─── Action Controls: Return to Room & Exit ─── */}
      <div className="flex items-center gap-2 pt-0.5">
        <Link
          href={`/servers/${activeRoom.serverId}/rooms/${activeRoom.roomId}`}
          className="flex-1 py-2 px-3 rounded-xl bg-brass-500 hover:bg-brass-400 text-espresso-950 font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer hover-spring"
        >
          <AppIcon name="maximize" size={14} />
          <span>{isVi ? "Quay lại phòng" : "Return to Room"}</span>
        </Link>

        <button
          type="button"
          onClick={handleExit}
          className="py-2 px-3 rounded-xl bg-bourbon-500/20 hover:bg-bourbon-500/30 text-bourbon-400 border border-bourbon-500/50 hover:border-bourbon-400 transition-all text-xs font-medium flex items-center justify-center gap-1 cursor-pointer hover-spring shrink-0"
          title={isVi ? "Rời phòng học" : "Leave Room"}
        >
          <AppIcon name="logout" size={14} />
          <span>{isVi ? "Rời" : "Exit"}</span>
        </button>
      </div>
    </div>
  );
}
