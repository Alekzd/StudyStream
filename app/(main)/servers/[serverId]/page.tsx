"use client";

import { use } from "react";
import { AppIcon } from "@/components/ui/Icon";
import { useLanguage } from "@/context/LanguageContext";
import { ChannelSidebar } from "@/components/server/ChannelSidebar";

export default function ServerPage({ params }: { params: Promise<{ serverId: string }> }) {
  const { serverId } = use(params);
  const { t } = useLanguage();

  return (
    <div className="flex flex-col h-full w-full">
      {/* On mobile: show channel sidebar right in view so mobile users can choose a room */}
      <div className="sm:hidden h-full w-full">
        <ChannelSidebar serverId={serverId} />
      </div>

      {/* On desktop: show sleek empty workstation prompt */}
      <div className="hidden sm:flex flex-col items-center justify-center h-full text-center p-8 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-espresso-900 border border-espresso-700 flex items-center justify-center text-brass-500 shadow-lg">
          <AppIcon name="coffee" size={32} />
        </div>
        <h2 className="text-lg font-bold text-crema-100 tracking-tight">
          {t("room_enter")}
        </h2>
        <p className="text-crema-600 text-xs md:text-sm max-w-sm leading-relaxed">
          {t("room_silent_notice")}
        </p>
      </div>
    </div>
  );
}
