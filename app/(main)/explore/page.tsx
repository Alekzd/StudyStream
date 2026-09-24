// app/(main)/explore/page.tsx
// StudyStream OS — Explore Public Workstations
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CreateRoomModal } from "@/components/server/CreateRoomModal";
import { BannerBackground } from "@/components/ui/BannerBackground";
import { AppIcon } from "@/components/ui/Icon";
import { useRouter } from "next/navigation";
import { cn, getArchetypeIcon, getArchetypeColor, getArchetypeLabel, cleanTitle } from "@/lib/utils";
import {
  PageTransition,
  StaggerContainer,
  StaggerItem,
  SkeletonPulse,
  MotionButton,
} from "@/components/ui/motion";

import { useLanguage } from "@/context/LanguageContext";

export default function ExplorePage() {
  const { t, language } = useLanguage();
  const isVi = language === "vi";
  const rooms = useQuery(api.rooms.getAllRooms);
  const dashboardSync = useQuery(api.users.getDashboardSync);
  const router = useRouter();

  return (
    <BannerBackground opacity={0.3}>
      <PageTransition className="flex flex-col h-full overflow-y-auto w-full select-none pb-safe-nav md:pb-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-8 py-4 sm:py-5 border-b border-espresso-700/80 bg-espresso-900/60 gap-3 sm:gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <AppIcon name="compass" size={20} className="text-brass-500" />
              <h1 className="text-lg sm:text-2xl font-bold text-crema-100 font-sans tracking-tight">
                {t("explore_title")}
              </h1>
            </div>
            <p className="text-crema-400 mt-0.5 text-xs sm:text-sm leading-relaxed max-w-xl hidden sm:block">
              {t("explore_subtitle")}
            </p>
          </div>
          <CreateRoomModal onCreated={(roomId) => {
            const room = rooms?.find(r => r._id === roomId);
            if (room) router.push(`/servers/${room.serverId}/rooms/${room._id}`);
          }} />
        </div>

        {/* Live Dashboard Sync Bar */}
        <div className="px-4 sm:px-8 py-2.5 bg-espresso-950/80 border-b border-espresso-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* Live Active Scholars count */}
            <div className="flex items-center gap-2 text-crema-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-patina-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-patina-500" />
              </span>
              <span className="font-mono font-medium text-[11px] sm:text-xs">
                <strong className="text-patina-400 font-bold">{dashboardSync?.totalActiveScholars ?? 0}</strong> {isVi ? "người đang học" : "scholars online"}
              </span>
            </div>

            <span className="text-espresso-700 hidden sm:inline">•</span>

            {/* Today Focus */}
            <div className="flex items-center gap-1.5 text-crema-400">
              <AppIcon name="clock" size={13} className="text-brass-400" />
              <span className="text-[11px] sm:text-xs">
                {isVi ? "Hôm nay:" : "Today:"} <strong className="text-crema-200 font-mono">{dashboardSync?.todayFocusMinutes ?? 0}m</strong>
              </span>
            </div>

            <span className="text-espresso-700 hidden sm:inline">•</span>

            {/* Streak */}
            <div className="flex items-center gap-1.5 text-crema-400">
              <AppIcon name="flame" size={13} className="text-bourbon-400" />
              <span className="text-[11px] sm:text-xs">
                {isVi ? "Chuỗi:" : "Streak:"} <strong className="text-crema-200 font-mono">{dashboardSync?.streakCount ?? 0}d</strong>
              </span>
            </div>
          </div>

          {/* Active Workstation Banner (if currently joined) */}
          {dashboardSync?.activeParticipant && (
            <div className="flex items-center gap-2 bg-bourbon-500/10 border border-bourbon-500/30 rounded-xl px-2.5 py-1 text-bourbon-300">
              <span className="w-1.5 h-1.5 rounded-full bg-bourbon-400 animate-pulse" />
              <span className="truncate max-w-[150px] sm:max-w-[200px] text-[11px]">
                {isVi ? "Đang ở:" : "In:"} <strong>{dashboardSync.activeParticipant.roomName}</strong>
              </span>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/servers/${dashboardSync.activeParticipant!.serverId}/rooms/${dashboardSync.activeParticipant!.roomId}`
                  )
                }
                className="ml-1 px-2 py-0.5 rounded-lg bg-bourbon-500/20 hover:bg-bourbon-500/30 text-crema-100 font-medium text-[11px] transition-colors cursor-pointer"
              >
                {isVi ? "Vào phòng" : "Resume"}
              </button>
            </div>
          )}
        </div>

        {/* Workstations Grid */}
        <div className="flex-1 p-3 sm:p-6 md:p-8">
          {rooms === undefined ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonPulse
                  key={i}
                  className="h-36 sm:h-44 rounded-2xl bg-espresso-900/60 border border-espresso-700/50"
                />
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-espresso-900 border border-espresso-700 flex items-center justify-center text-brass-500 shadow-md">
                <AppIcon name="coffee" size={32} />
              </div>
              <p className="text-crema-100 text-base sm:text-lg font-semibold font-sans">
                No active workstations found.
              </p>
              <p className="text-crema-400 text-xs sm:text-sm max-w-sm leading-relaxed">
                Be the first to open a study room for today&apos;s focus session.
              </p>
              <CreateRoomModal onCreated={(roomId) => {
                const room = rooms?.find(r => r._id === roomId);
                if (room) router.push(`/servers/${room.serverId}/rooms/${room._id}`);
              }}>
                <MotionButton variant="brass" size="sm" className="mt-2">
                  <span>Open First Workstation</span>
                </MotionButton>
              </CreateRoomModal>
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rooms.map((room) => (
                <StaggerItem key={room._id}>
                  <div
                    onClick={() => router.push(`/servers/${room.serverId}/rooms/${room._id}`)}
                    className="group relative flex flex-col justify-between p-4 rounded-2xl bg-espresso-900/80 hover:bg-espresso-850 border border-espresso-750/80 hover:border-brass-500/50 transition-all cursor-pointer shadow-md hover:shadow-xl hover:-translate-y-0.5"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold uppercase tracking-wider bg-espresso-800 border border-espresso-700",
                          getArchetypeColor(room.archetype)
                        )}>
                          <AppIcon name={getArchetypeIcon(room.archetype)} size={13} />
                          <span>{getArchetypeLabel(room.archetype)}</span>
                        </span>

                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold",
                          room.isLocked
                            ? "text-bourbon-400 bg-bourbon-500/10 border border-bourbon-500/20"
                            : "text-patina-400 bg-patina-500/10 border border-patina-500/20"
                        )}>
                          {room.isLocked ? (
                            <>
                              <AppIcon name="lock" size={10} />
                              <span>Locked</span>
                            </>
                          ) : (
                            <>
                              <AppIcon name="globe" size={10} />
                              <span>Public</span>
                            </>
                          )}
                        </span>
                      </div>

                      {/* Room Name */}
                      <h3 className="text-base font-bold text-crema-100 group-hover:text-brass-300 transition-colors font-sans mb-1 line-clamp-1">
                        {cleanTitle(room.name)}
                      </h3>
                      <p className="text-crema-400 text-xs line-clamp-2 leading-relaxed hidden sm:block">
                        Virtual workstation with camera accountability and central cadence.
                      </p>
                    </div>

                    {/* Bottom Info & Action */}
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-espresso-750/60">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-crema-400">
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          room.participantCount > 0 ? "bg-patina-400" : "bg-crema-600"
                        )} />
                        <span>{room.participantCount} / {room.maxParticipants} online</span>
                      </div>

                      <span className="text-xs font-semibold text-brass-400 group-hover:text-brass-300 flex items-center gap-1 transition-transform group-hover:translate-x-0.5">
                        <span>Enter</span>
                        <span>→</span>
                      </span>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </PageTransition>
    </BannerBackground>
  );
}
