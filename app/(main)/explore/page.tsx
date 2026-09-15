// app/(main)/explore/page.tsx
// StudyStream OS — Explore Public Stations
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ServerCard } from "@/components/server/ServerCard";
import { CreateServerModal } from "@/components/server/CreateServerModal";
import { BannerBackground } from "@/components/ui/BannerBackground";
import { AppIcon } from "@/components/ui/Icon";
import { useLanguage } from "@/context/LanguageContext";

export default function ExplorePage() {
  const publicServers = useQuery(api.servers.getPublicServers, { limit: 20 });
  const { t } = useLanguage();

  return (
    <BannerBackground opacity={0.3}>
      <div className="flex flex-col h-full overflow-y-auto w-full select-none">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-8 py-5 border-b border-espresso-700/80 bg-espresso-900/60 backdrop-blur-md gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <AppIcon name="compass" size={22} className="text-brass-500" />
              <h1 className="text-xl sm:text-2xl font-bold text-crema-100 font-sans tracking-tight">
                {t("explore_title")}
              </h1>
            </div>
            <p className="text-crema-400 mt-1 text-xs sm:text-sm leading-relaxed max-w-xl">
              {t("explore_subtitle")}
            </p>
          </div>
          <CreateServerModal />
        </div>

        {/* Workstation Grid */}
        <div className="flex-1 p-4 sm:p-6 md:p-8">
          {publicServers === undefined ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-44 rounded-2xl bg-espresso-900/60 border border-espresso-700/50 animate-pulse"
                />
              ))}
            </div>
          ) : publicServers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-espresso-900 border border-espresso-700 flex items-center justify-center text-brass-500 shadow-md">
                <AppIcon name="coffee" size={32} />
              </div>
              <p className="text-crema-100 text-base sm:text-lg font-semibold">
                {t("explore_empty")}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicServers.map((server) => (
                <ServerCard key={server._id} server={server} />
              ))}
            </div>
          )}
        </div>
      </div>
    </BannerBackground>
  );
}
