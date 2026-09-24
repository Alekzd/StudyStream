"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppIcon } from "@/components/ui/Icon";
import { useLanguage } from "@/context/LanguageContext";
import { useActiveRoom } from "@/context/ActiveRoomContext";
import { CreateRoomModal } from "@/components/server/CreateRoomModal";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { language } = useLanguage();
  const { activeRoom } = useActiveRoom();
  const isVi = language === "vi";
  const rooms = useQuery(api.rooms.getAllRooms);

  // Hide inside room pages — FloatingQuickActions takes over there
  const isInRoomPage = pathname.includes("/rooms/");
  if (isInRoomPage) return null;

  const isExplore = pathname === "/explore" || pathname === "/";
  const isProfile = pathname === "/profile";

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 select-none"
      aria-label="Mobile navigation"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="bg-espresso-900 border-t border-espresso-700 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-stretch h-[3.5rem]">

          {/* ── Explore ── */}
          <Link
            href="/explore"
            id="mobile-nav-explore"
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95",
              isExplore ? "text-brass-300" : "text-crema-600 hover:text-crema-300"
            )}
            aria-label={isVi ? "Khám Phá Trạm" : "Explore Stations"}
            aria-current={isExplore ? "page" : undefined}
          >
            <div className={cn(
              "w-8 h-8 flex items-center justify-center rounded-xl transition-all",
              isExplore && "bg-brass-500/20 ring-1 ring-brass-500/40"
            )}>
              <AppIcon name="compass" size={20} />
            </div>
            <span className="text-[10px] font-mono font-semibold tracking-wide leading-none">
              {isVi ? "Khám Phá" : "Explore"}
            </span>
            {/* Active dot — below the label, never clips the icon */}
            {isExplore && (
              <span className="w-1 h-1 rounded-full bg-brass-400 mt-0.5" />
            )}
          </Link>

          {/* ── Create Room (Center CTA) ── */}
          <div className="flex-1 flex flex-col items-center justify-center px-2">
            <CreateRoomModal
              onCreated={(roomId) => {
                const room = rooms?.find((r) => r._id === roomId);
                if (room) router.push(`/servers/${room.serverId}/rooms/${room._id}`);
              }}
            >
              <button
                id="mobile-nav-create"
                type="button"
                className="flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all"
                aria-label={isVi ? "Tạo phòng mới" : "Create Room"}
              >
                <div className="w-11 h-11 rounded-2xl bg-brass-500 hover:bg-brass-400 flex items-center justify-center shadow-lg shadow-brass-900/40 transition-all">
                  <AppIcon name="plus" size={22} className="text-espresso-950" />
                </div>
                <span className="text-[10px] font-mono font-semibold tracking-wide leading-none text-brass-400">
                  {isVi ? "Tạo Phòng" : "New Room"}
                </span>
              </button>
            </CreateRoomModal>
          </div>

          {/* ── Profile / Stats ── */}
          <Link
            href="/profile"
            id="mobile-nav-profile"
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95",
              isProfile ? "text-bourbon-300" : "text-crema-600 hover:text-crema-300"
            )}
            aria-label={isVi ? "Hồ Sơ" : "Profile"}
            aria-current={isProfile ? "page" : undefined}
          >
            <div className={cn(
              "relative w-8 h-8 flex items-center justify-center rounded-xl transition-all",
              isProfile && "bg-bourbon-500/20 ring-1 ring-bourbon-500/40"
            )}>
              <AppIcon name="flame" size={20} className="text-bourbon-400" />
              {/* Active room indicator — sits inside the icon container, inset so it doesn't overflow */}
              {activeRoom && !isProfile && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-patina-400 border-2 border-espresso-900 animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-mono font-semibold tracking-wide leading-none">
              {isVi ? "Hồ Sơ" : "Stats"}
            </span>
            {/* Active dot — below the label */}
            {isProfile && (
              <span className="w-1 h-1 rounded-full bg-bourbon-400 mt-0.5" />
            )}
          </Link>

        </div>
      </div>
    </nav>
  );
}
