"use client";
// components/server/ServerSidebar.tsx
// StudyStream OS — Narrow left rail showing user's servers as icons

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Separator } from "@radix-ui/react-separator";
import { Plus, Compass, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateServerModal } from "./CreateServerModal";

export function ServerSidebar() {
  const servers = useQuery(api.servers.getMyServers);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex flex-col items-center w-[72px] bg-neutral-900 py-3 gap-2 border-r border-neutral-800 overflow-y-auto">
      {/* Explore icon */}
      <button
        onClick={() => router.push("/explore")}
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 hover:rounded-xl",
          pathname === "/explore"
            ? "bg-indigo-600 rounded-xl"
            : "bg-neutral-800 hover:bg-indigo-500"
        )}
        title="Khám phá"
      >
        <Compass size={22} className="text-neutral-100" />
      </button>

      {/* Profile & Streak icon */}
      <button
        onClick={() => router.push("/profile")}
        className={cn(
          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 hover:rounded-xl",
          pathname === "/profile"
            ? "bg-amber-600 rounded-xl"
            : "bg-neutral-800 hover:bg-amber-500/30 text-amber-400"
        )}
        title="Hồ sơ & Chuỗi học tập"
      >
        <Flame size={22} />
      </button>

      <Separator className="w-8 h-px bg-neutral-700 my-1" />

      {/* Server icons */}
      {servers?.map((server) => {
        const isActive = pathname.includes(`/servers/${server._id}`);
        return (
          <button
            key={server._id}
            onClick={() => router.push(`/servers/${server._id}`)}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold transition-all duration-200 hover:rounded-xl",
              isActive
                ? "bg-indigo-600 rounded-xl"
                : "bg-neutral-800 hover:bg-indigo-500"
            )}
            title={server.name}
          >
            {server.iconUrl ? (
              <img
                src={server.iconUrl}
                alt={server.name}
                className="w-full h-full object-cover rounded-inherit"
              />
            ) : (
              <span className="text-neutral-100">
                {server.name.charAt(0).toUpperCase()}
              </span>
            )}
          </button>
        );
      })}

      {/* Add server button */}
      <CreateServerModal>
        <button
          className="w-12 h-12 rounded-2xl flex items-center justify-center bg-neutral-800 hover:bg-green-600 hover:rounded-xl transition-all duration-200 text-green-400 hover:text-white"
          title="Tạo không gian mới"
        >
          <Plus size={22} />
        </button>
      </CreateServerModal>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User avatar at bottom */}
      <div className="pb-2">
        <UserButton />
      </div>
    </div>
  );
}
