"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter, usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { CreateServerModal } from "./CreateServerModal";
import { AppIcon } from "@/components/ui/Icon";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/context/LanguageContext";

export function ServerSidebar() {
  const servers = useQuery(api.servers.getMyServers);
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <aside className="flex flex-col items-center w-16 bg-espresso-900 py-3 gap-2 border-r border-espresso-700/80 shrink-0 h-full overflow-y-auto select-none">
      {/* Brand Icon (Espresso Hot Cup) */}
      <button
        onClick={() => router.push("/explore")}
        className="w-11 h-11 rounded-xl flex items-center justify-center bg-espresso-850 hover:bg-espresso-800 border border-espresso-700 text-brass-500 hover:text-brass-400 transition-all duration-200 group"
        title={t("app_title")}
      >
        <AppIcon name="coffee" size={22} className="group-hover:scale-110 transition-transform" />
      </button>

      <div className="w-8 h-px bg-espresso-700/80 my-1" />

      {/* Explore icon */}
      <button
        onClick={() => router.push("/explore")}
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200",
          pathname === "/explore"
            ? "bg-brass-500 text-espresso-950 shadow-md font-bold"
            : "bg-espresso-850 text-crema-400 hover:bg-espresso-750 hover:text-crema-100 border border-espresso-700/60"
        )}
        title={t("nav_explore")}
      >
        <AppIcon name="compass" size={20} />
      </button>

      {/* Profile & Streak icon */}
      <button
        onClick={() => router.push("/profile")}
        className={cn(
          "w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200",
          pathname === "/profile"
            ? "bg-bourbon-500 text-crema-50 shadow-md"
            : "bg-espresso-850 text-bourbon-400 hover:bg-espresso-750 hover:text-bourbon-300 border border-espresso-700/60"
        )}
        title={t("nav_profile")}
      >
        <AppIcon name="flame" size={20} />
      </button>

      <div className="w-8 h-px bg-espresso-700/80 my-1" />

      {/* Server icons list */}
      <div className="flex flex-col gap-2 w-full items-center flex-1 overflow-y-auto overflow-x-hidden py-1">
        {servers?.map((server) => {
          const isActive = pathname.includes(`/servers/${server._id}`);
          return (
            <button
              key={server._id}
              onClick={() => router.push(`/servers/${server._id}`)}
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center text-sm font-mono font-bold transition-all duration-200 shrink-0",
                isActive
                  ? "bg-brass-500/20 text-brass-300 border border-brass-500/60"
                  : "bg-espresso-850 text-crema-400 hover:bg-espresso-750 hover:text-crema-200 border border-espresso-700/60"
              )}
              title={server.name}
            >
              {server.iconUrl ? (
                <img
                  src={server.iconUrl}
                  alt={server.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <span>{server.name.charAt(0).toUpperCase()}</span>
              )}
            </button>
          );
        })}

        {/* Add Server Button */}
        <CreateServerModal>
          <button
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-espresso-850 hover:bg-espresso-750 text-patina-400 hover:text-patina-300 border border-espresso-700/60 hover:border-patina-500/40 transition-all duration-200 shrink-0"
            title={t("nav_create_server")}
          >
            <AppIcon name="plus" size={20} />
          </button>
        </CreateServerModal>
      </div>

      {/* Language Toggle */}
      <div className="py-1">
        <LanguageToggle variant="compact" />
      </div>

      {/* User profile button */}
      <div className="pt-2 border-t border-espresso-700/80 w-full flex justify-center">
        <UserButton />
      </div>
    </aside>
  );
}
