"use client";
// components/server/ChannelSidebar.tsx
// StudyStream OS — Room/Channel list sidebar (Discord-style)

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";
import { cn, getArchetypeLabel } from "@/lib/utils";
import { Users, Lock, Plus, Settings } from "lucide-react";
import { CreateRoomModal } from "./CreateRoomModal";
import { Id } from "@/convex/_generated/dataModel";

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

  if (!server) {
    return (
      <div className="w-60 bg-neutral-900 border-r border-neutral-800 p-4">
        <div className="h-6 w-3/4 bg-neutral-800 rounded animate-pulse mb-4" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 bg-neutral-800 rounded mb-2 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-60 bg-neutral-900 border-r border-neutral-800">
      {/* Server header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-800">
        <h2 className="font-bold text-neutral-100 truncate text-sm">{server.name}</h2>
        <button className="text-neutral-500 hover:text-neutral-300 transition-colors">
          <Settings size={16} />
        </button>
      </div>

      {/* Rooms list grouped by category */}
      <div className="flex-1 overflow-y-auto py-2">
        {categories?.map((category) => {
          const categoryRooms = rooms?.filter(
            (r) => r.categoryId === category._id
          );

          return (
            <div key={category._id} className="mb-4">
              <div className="flex items-center justify-between px-3 py-1.5">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  {category.name}
                </span>
                <CreateRoomModal
                  serverId={serverId as Id<"servers">}
                  categoryId={category._id}
                >
                  <button className="text-neutral-600 hover:text-neutral-300 transition-colors">
                    <Plus size={14} />
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
                      "flex items-center gap-2 w-full px-3 py-1.5 mx-1 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-neutral-700 text-neutral-100"
                        : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                    )}
                  >
                    {room.isLocked && <Lock size={12} className="shrink-0" />}
                    <span className="truncate flex-1 text-left">
                      {getArchetypeLabel(room.archetype).split(" ")[0]}{" "}
                      {room.name}
                    </span>
                    {room.participantCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                        <Users size={11} />
                        {room.participantCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}

        {/* Uncategorized rooms */}
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
                  "flex items-center gap-2 w-full px-3 py-1.5 mx-1 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-neutral-700 text-neutral-100"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
                )}
              >
                <span className="truncate flex-1 text-left">
                  {getArchetypeLabel(room.archetype).split(" ")[0]} {room.name}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
