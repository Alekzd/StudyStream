"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { AppIcon } from "@/components/ui/Icon";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CreateServerModal } from "@/components/server/CreateServerModal";

export function MobileHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const servers = useQuery(api.servers.getMyServers);

  const navigateTo = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  return (
    <>
      {/* Top Mobile Bar */}
      <header className="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-espresso-900 border-b border-espresso-700/80 z-30 shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 -ml-1 rounded-lg bg-espresso-850 border border-espresso-700 text-brass-500 hover:text-crema-50 transition-colors"
            aria-label="Open Navigation Menu"
          >
            <AppIcon name="menu" size={18} />
          </button>
          <div className="flex items-center gap-1.5" onClick={() => router.push("/explore")}>
            <AppIcon name="coffee" size={18} className="text-brass-500" />
            <span className="font-mono font-bold text-sm text-crema-100 tracking-tight truncate max-w-[140px]">
              StudyStream
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle variant="compact" />
          <UserButton />
        </div>
      </header>

      {/* Slide-out Mobile Navigation Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-[320px] bg-espresso-900 border-r border-espresso-700 h-full flex flex-col p-4 z-10 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-espresso-700/80 mb-4">
              <div className="flex items-center gap-2">
                <AppIcon name="coffee" size={22} className="text-brass-500" />
                <span className="font-bold text-base text-crema-100">The Midnight Atelier</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-crema-600 hover:text-crema-100 hover:bg-espresso-800 transition-colors"
              >
                <AppIcon name="close" size={18} />
              </button>
            </div>

            {/* Quick Links */}
            <div className="flex flex-col gap-1 mb-4">
              <button
                onClick={() => navigateTo("/explore")}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                  pathname === "/explore"
                    ? "bg-brass-500/20 text-brass-300 border border-brass-500/40"
                    : "text-crema-400 hover:bg-espresso-800 hover:text-crema-100"
                )}
              >
                <AppIcon name="compass" size={18} />
                <span>{t("nav_explore")}</span>
              </button>

              <button
                onClick={() => navigateTo("/profile")}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left",
                  pathname === "/profile"
                    ? "bg-bourbon-500/20 text-bourbon-400 border border-bourbon-500/40"
                    : "text-crema-400 hover:bg-espresso-800 hover:text-crema-100"
                )}
              >
                <AppIcon name="flame" size={18} />
                <span>{t("nav_profile")}</span>
              </button>
            </div>

            <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-crema-600 mb-2 px-1">
              {t("nav_channels")}
            </div>

            {/* Servers List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {servers?.map((s) => (
                <button
                  key={s._id}
                  onClick={() => navigateTo(`/servers/${s._id}`)}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm transition-colors text-left",
                    pathname.includes(`/servers/${s._id}`)
                      ? "bg-espresso-800 text-brass-300 border border-espresso-700 font-semibold"
                      : "text-crema-400 hover:bg-espresso-800 hover:text-crema-200"
                  )}
                >
                  <div className="w-7 h-7 rounded-lg bg-espresso-750 flex items-center justify-center font-mono font-bold text-xs text-brass-400 shrink-0 border border-espresso-700">
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{s.name}</span>
                </button>
              ))}

              <CreateServerModal>
                <button className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm text-patina-400 hover:bg-espresso-800 hover:text-patina-300 transition-colors mt-2 border border-dashed border-espresso-700">
                  <AppIcon name="plus" size={16} />
                  <span>{t("nav_create_server")}</span>
                </button>
              </CreateServerModal>
            </div>

            <div className="pt-3 border-t border-espresso-700/80 flex items-center justify-between mt-auto">
              <span className="text-xs text-crema-600 font-mono">StudyStream OS v0.1</span>
              <LanguageToggle />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
