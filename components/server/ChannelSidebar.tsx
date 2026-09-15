"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";
import { cn, getArchetypeLabel } from "@/lib/utils";
import { AppIcon } from "@/components/ui/Icon";
import { CreateRoomModal } from "./CreateRoomModal";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/context/LanguageContext";

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
  const { t } = useLanguage();

  if (!server) {
    return (
      <div className="w-56 md:w-60 bg-espresso-900 border-r border-espresso-700/80 p-4 shrink-0 flex flex-col gap-3">
        <div className="h-6 w-3/4 bg-espresso-800 rounded animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 bg-espresso-850 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-56 md:w-60 bg-espresso-900 border-r border-espresso-700/80 shrink-0 h-full overflow-hidden select-none">
      {/* Server Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-espresso-700/80 bg-espresso-900/90">
        <h2 className="font-bold text-crema-100 truncate text-sm font-sans tracking-tight">
          {server.name}
        </h2>
        <button
          className="text-crema-600 hover:text-brass-400 p-1 rounded-md transition-colors"
          title={t("nav_settings")}
        >
          <AppIcon name="settings" size={16} />
        </button>
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
                    onClick={() =>
                      router.push(`/servers/${serverId}/rooms/${room._id}`)
                    }
                    className={cn(
                      "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs md:text-sm transition-all duration-150 text-left",
                      isActive
                        ? "bg-espresso-800 text-brass-300 font-semibold border border-espresso-700 shadow-sm"
                        : "text-crema-400 hover:bg-espresso-850 hover:text-crema-200"
                    )}
                  >
                    {room.isLocked && (
                      <AppIcon name="lock" size={12} className="text-crema-600 shrink-0" />
                    )}
                    <span className="truncate flex-1">
                      {getArchetypeLabel(room.archetype).split(" ")[0]} {room.name}
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
                onClick={() =>
                  router.push(`/servers/${serverId}/rooms/${room._id}`)
                }
                className={cn(
                  "flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs md:text-sm transition-all duration-150 text-left",
                  isActive
                    ? "bg-espresso-800 text-brass-300 font-semibold border border-espresso-700 shadow-sm"
                    : "text-crema-400 hover:bg-espresso-850 hover:text-crema-200"
                )}
              >
                <span className="truncate flex-1">
                  {getArchetypeLabel(room.archetype).split(" ")[0]} {room.name}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
