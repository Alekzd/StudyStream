"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";
import { cn, getArchetypeIcon, cleanTitle } from "@/lib/utils";
import { AppIcon } from "@/components/ui/Icon";
import { CreateRoomModal } from "./CreateRoomModal";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/context/LanguageContext";
import { useActiveRoom } from "@/context/ActiveRoomContext";
import { SkeletonPulse, MotionButton } from "@/components/ui/motion";

interface ChannelSidebarProps {
  serverId: string;
}

export function ChannelSidebar({ serverId }: ChannelSidebarProps) {
  const server = useQuery(api.servers.getServerById, {
    serverId: serverId as Id<"servers">,
  });
  const categories = useQuery(api.rooms.getCategoriesInServer, {
    serverId: serverId as Id<"servers">,
  });
  const rooms = useQuery(api.rooms.getRoomsInServer, {
    serverId: serverId as Id<"servers">,
  });
  const router = useRouter();
  const pathname = usePathname();
  const { t, language } = useLanguage();
  const { activeRoom, leaveActiveRoom } = useActiveRoom();
  const [pendingSwitchRoom, setPendingSwitchRoom] = useState<{ id: string; name: string } | null>(null);

  const handleRoomClick = (targetRoomId: string, targetRoomName: string) => {
    if (activeRoom && activeRoom.roomId !== targetRoomId) {
      setPendingSwitchRoom({ id: targetRoomId, name: targetRoomName });
      return;
    }
    router.push(`/servers/${serverId}/rooms/${targetRoomId}`);
  };

  if (!server) {
    return (
      <div className="w-56 md:w-60 bg-espresso-900 border-r border-espresso-700/80 p-4 shrink-0 flex flex-col gap-3">
        <SkeletonPulse className="h-6 w-3/4 bg-espresso-800 rounded" />
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonPulse key={i} className="h-8 bg-espresso-850 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-56 md:w-60 bg-espresso-900 border-r border-espresso-700/80 shrink-0 h-full overflow-hidden select-none">
      {/* Server Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-espresso-700/80 bg-espresso-900/90">
        <h2 className="font-bold text-crema-100 truncate text-sm font-sans tracking-tight">
          {cleanTitle(server.name)}
        </h2>
        <MotionButton
          variant="ghost"
          size="icon"
          className="w-7 h-7 text-crema-600 hover:text-brass-400 rounded-md"
          title={t("nav_settings")}
        >
          <AppIcon name="settings" size={16} />
        </MotionButton>
      </div>

      {/* Rooms List Grouped by Category */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {categories?.map((category) => {
          const categoryRooms = rooms?.filter(
            (r) => r.categoryId === category._id
          );

          return (
            <div key={category._id} className="space-y-1">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[11px] font-mono font-semibold text-crema-600 uppercase tracking-wider">
                  {category.name}
                </span>
                <CreateRoomModal
                  serverId={serverId as Id<"servers">}
                  categoryId={category._id}
                >
                  <button
                    className="text-crema-600 hover:text-brass-400 transition-colors p-0.5"
                    title={t("nav_create_server")}
                  >
                    <AppIcon name="plus" size={13} />
                  </button>
                </CreateRoomModal>
              </div>

              {categoryRooms?.map((room) => {
                const isActive = pathname.includes(`/rooms/${room._id}`);

                return (
                  <button
                    key={room._id}
                    onClick={() => handleRoomClick(room._id, room.name)}
                    className={cn(
                      "group flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs md:text-sm transition-all duration-150 text-left cursor-pointer",
                      isActive
                        ? "bg-espresso-800 text-brass-300 font-semibold border border-espresso-700 shadow-sm"
                        : "text-crema-400 hover:bg-espresso-850 hover:text-crema-200"
                    )}
                  >
                    {room.isLocked ? (
                      <AppIcon name="lock" size={13} className="text-bourbon-400 shrink-0" />
                    ) : (
                      <AppIcon
                        name={getArchetypeIcon(room.archetype)}
                        size={14}
                        className={cn(
                          "shrink-0 transition-colors",
                          isActive ? "text-brass-300" : "text-crema-500 group-hover:text-crema-200"
                        )}
                      />
                    )}
                    <span className="truncate flex-1">
                      {cleanTitle(room.name)}
                    </span>
                    {room.participantCount > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-patina-400 font-mono shrink-0">
                        <AppIcon name="users" size={11} />
                        {room.participantCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Uncategorized Rooms */}
        {rooms
          ?.filter((r) => !r.categoryId)
          .map((room) => {
            const isActive = pathname.includes(`/rooms/${room._id}`);
            return (
              <button
                key={room._id}
                onClick={() => handleRoomClick(room._id, room.name)}
                className={cn(
                  "group flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs md:text-sm transition-all duration-150 text-left cursor-pointer",
                  isActive
                    ? "bg-espresso-800 text-brass-300 font-semibold border border-espresso-700 shadow-sm"
                    : "text-crema-400 hover:bg-espresso-850 hover:text-crema-200"
                )}
              >
                {room.isLocked ? (
                  <AppIcon name="lock" size={13} className="text-bourbon-400 shrink-0" />
                ) : (
                  <AppIcon
                    name={getArchetypeIcon(room.archetype)}
                    size={14}
                    className={cn(
                      "shrink-0 transition-colors",
                      isActive ? "text-brass-300" : "text-crema-500 group-hover:text-crema-200"
                    )}
                  />
                )}
                <span className="truncate flex-1">
                  {cleanTitle(room.name)}
                </span>
              </button>
            );
          })}
      </div>

      {/* Room Switch Restraint Confirmation Modal */}
      {pendingSwitchRoom && activeRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso-950/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm p-4 bg-espresso-900 border border-bourbon-500/60 rounded-2xl shadow-2xl space-y-3 animate-pop-in">
            <div className="flex items-center gap-2 text-bourbon-400">
              <AppIcon name="logout" size={18} />
              <h3 className="font-bold text-crema-100 text-sm">
                {language === "vi" ? "Đang trong phòng học" : "Active in Another Room"}
              </h3>
            </div>
            <p className="text-xs text-crema-300 font-mono leading-relaxed">
              {language === "vi"
                ? `Bạn đang tham gia phòng "${cleanTitle(activeRoom.roomName)}". Bạn có muốn rời phòng cũ để chuyển sang "${cleanTitle(pendingSwitchRoom.name)}" không?`
                : `You are currently in "${cleanTitle(activeRoom.roomName)}". Do you want to leave it and switch to "${cleanTitle(pendingSwitchRoom.name)}"?`}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingSwitchRoom(null)}
                className="flex-1 py-2 px-3 rounded-xl bg-espresso-800 hover:bg-espresso-750 text-crema-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                {language === "vi" ? "Ở lại phòng cũ" : "Stay in current"}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const targetId = pendingSwitchRoom.id;
                  setPendingSwitchRoom(null);
                  await leaveActiveRoom();
                  router.push(`/servers/${serverId}/rooms/${targetId}`);
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-brass-500 hover:bg-brass-400 text-espresso-950 text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                {language === "vi" ? "Rời & Chuyển phòng" : "Leave & Switch"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
