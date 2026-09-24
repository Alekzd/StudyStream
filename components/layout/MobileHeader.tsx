"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { AppIcon } from "@/components/ui/Icon";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/context/LanguageContext";
import { cn, getArchetypeIcon, getArchetypeColor, cleanTitle } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CreateRoomModal } from "@/components/server/CreateRoomModal";
import { SidebarAudioWidget } from "@/components/soundscape/SidebarAudioWidget";

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { t, language } = useLanguage();
  const isVi = language === "vi";
  const rooms = useQuery(api.rooms.getAllRooms);

  return (
    <>
      {/* Top Mobile Bar — compact, 48px tall for adequate touch targets */}
      <header
        className="md:hidden flex items-center justify-between px-3 bg-espresso-900 border-b border-espresso-700/80 z-30 shrink-0 select-none"
        style={{
          height: "3rem",
          paddingTop: "max(0px, env(safe-area-inset-top))",
        }}
      >
        <div className="flex items-center gap-2">
          {/* Hamburger — 44px touch target */}
          <button
            onClick={() => setIsOpen(true)}
            className="w-11 h-11 -ml-2 flex items-center justify-center rounded-xl text-brass-500 hover:text-crema-50 hover:bg-espresso-800 transition-colors active:scale-95"
            aria-label={isVi ? "Mở menu điều hướng" : "Open navigation menu"}
            aria-expanded={isOpen}
          >
            <AppIcon name="menu" size={20} />
          </button>
          <Link href="/explore" className="flex items-center gap-1.5 cursor-pointer" aria-label="StudyStream Home">
            <AppIcon name="coffee" size={17} className="text-brass-500 shrink-0" />
            <span className="font-mono font-bold text-sm text-crema-100 tracking-tight">
              StudyStream
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle variant="compact" />
          <UserButton />
        </div>
      </header>

      {/* Drawer Overlay + Panel — animated slide-in */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Navigation drawer">
          {/* Backdrop — fade in */}
          <div
            className="fixed inset-0 bg-black/75 animate-pip-in"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Panel — slides in from left */}
          <div
            className="relative w-4/5 max-w-[320px] bg-espresso-900 border-r border-espresso-700 h-full flex flex-col z-10 shadow-2xl overflow-hidden animate-drawer-left"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-espresso-700/80 shrink-0">
              <div className="flex items-center gap-2">
                <AppIcon name="coffee" size={20} className="text-brass-500" />
                <span className="font-bold text-sm text-crema-100 font-sans">StudyStream</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-xl text-crema-600 hover:text-crema-100 hover:bg-espresso-800 transition-colors flex items-center justify-center active:scale-95"
                aria-label={isVi ? "Đóng menu" : "Close navigation"}
              >
                <AppIcon name="close" size={18} />
              </button>
            </div>

            {/* Primary Navigation Links — 48px touch targets */}
            <div className="flex flex-col gap-1 px-3 py-2 shrink-0">
              <Link
                href="/explore"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 h-12 rounded-xl text-sm font-medium transition-colors",
                  pathname === "/explore" || pathname === "/"
                    ? "bg-brass-500/20 text-brass-300 border border-brass-500/40"
                    : "text-crema-400 hover:bg-espresso-800 hover:text-crema-100"
                )}
              >
                <AppIcon name="compass" size={20} className="shrink-0" />
                <span>{isVi ? "Khám Phá Trạm" : "Explore Stations"}</span>
              </Link>

              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 h-12 rounded-xl text-sm font-medium transition-colors",
                  pathname === "/profile"
                    ? "bg-bourbon-500/20 text-bourbon-400 border border-bourbon-500/40"
                    : "text-crema-400 hover:bg-espresso-800 hover:text-crema-100"
                )}
              >
                <AppIcon name="flame" size={20} className="text-bourbon-400 shrink-0" />
                <span>{t("nav_profile")}</span>
              </Link>
            </div>

            {/* Study Rooms Section Header */}
            <div className="flex items-center justify-between px-4 py-1.5 shrink-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-crema-600">
                {isVi ? "Phòng Học" : "Study Rooms"} ({rooms?.length ?? 0})
              </span>
              <CreateRoomModal
                onCreated={(roomId) => {
                  setIsOpen(false);
                  const room = rooms?.find((r) => r._id === roomId);
                  if (room) router.push(`/servers/${room.serverId}/rooms/${room._id}`);
                }}
              >
                <button
                  type="button"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-brass-400 hover:text-brass-300 hover:bg-espresso-800 transition-colors active:scale-95"
                >
                  <AppIcon name="plus" size={12} />
                  <span>{isVi ? "Tạo mới" : "New"}</span>
                </button>
              </CreateRoomModal>
            </div>

            {/* Room List — scrollable, 44px+ row targets */}
            <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-0.5">
              {rooms?.map((r) => (
                <Link
                  key={r._id}
                  href={`/servers/${r.serverId}/rooms/${r._id}`}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 h-12 rounded-xl text-sm transition-colors",
                    pathname.includes(`/rooms/${r._id}`)
                      ? "bg-espresso-800 text-brass-300 border border-espresso-700 font-semibold"
                      : "text-crema-400 hover:bg-espresso-800 hover:text-crema-200"
                  )}
                >
                  <AppIcon
                    name={r.isLocked ? "lock" : getArchetypeIcon(r.archetype)}
                    size={16}
                    className={cn(
                      r.isLocked ? "text-bourbon-400" : getArchetypeColor(r.archetype),
                      "shrink-0"
                    )}
                  />
                  <span className="truncate flex-1 font-sans text-sm">{cleanTitle(r.name)}</span>
                  {r.participantCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-bourbon-400 bg-bourbon-500/15 border border-bourbon-500/30 px-1.5 py-0.5 rounded-md shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-bourbon-400 animate-pulse" />
                      <span>{r.participantCount}</span>
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Soundscape Widget */}
            <div className="px-3 py-2 border-t border-espresso-700/80 shrink-0">
              <SidebarAudioWidget />
            </div>

            {/* Footer: Language only (user already visible in top bar) */}
            <div className="px-4 py-2.5 border-t border-espresso-700/80 flex items-center justify-between shrink-0">
              <span className="text-[11px] font-mono text-crema-600">StudyStream Commons</span>
              <LanguageToggle />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
