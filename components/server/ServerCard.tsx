"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AppIcon } from "@/components/ui/Icon";
import { useLanguage } from "@/context/LanguageContext";
import { cleanTitle, getServerIcon } from "@/lib/utils";

interface ServerCardProps {
  server: {
    _id: Id<"servers">;
    name: string;
    description?: string;
    iconUrl?: string;
    isPublic: boolean;
    inviteCode: string;
    defaultPomodoroWork: number;
    defaultPomodoroBreak: number;
    createdAt: number;
    slug: string;
    ownerId: Id<"users">;
  };
}

export function ServerCard({ server }: ServerCardProps) {
  const router = useRouter();
  const joinByCode = useMutation(api.servers.joinByCode);
  const { t } = useLanguage();

  const handleJoin = async () => {
    try {
      const { serverId } = await joinByCode({ inviteCode: server.inviteCode });
      router.push(`/servers/${serverId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      console.error("Join failed:", msg);
    }
  };

  return (
    <div className="bg-espresso-900 border border-espresso-700/80 rounded-2xl p-5 hover:border-brass-500/40 transition-all duration-200 flex flex-col justify-between gap-4 group shadow-sm select-none">
      <div className="flex items-center gap-3.5">
        {server.iconUrl ? (
          <Image
            src={server.iconUrl}
            alt={server.name}
            width={48}
            height={48}
            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-espresso-700"
            unoptimized
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-espresso-800 border border-espresso-700 flex items-center justify-center text-brass-400 shrink-0 group-hover:border-brass-500/30 transition-colors shadow-sm">
            <AppIcon name={getServerIcon(server.slug)} size={22} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-crema-100 truncate text-sm sm:text-base group-hover:text-brass-300 transition-colors">
            {cleanTitle(server.name)}
          </h3>
          <p className="text-[11px] font-mono text-crema-600 flex items-center gap-1.5 mt-0.5">
            <AppIcon name="clock" size={12} className="text-brass-500" />
            <span>
              {server.defaultPomodoroWork}m / {server.defaultPomodoroBreak}m cycle
            </span>
          </p>
        </div>
      </div>

      {server.description && (
        <p className="text-xs text-crema-400 line-clamp-2 leading-relaxed">
          {server.description}
        </p>
      )}

      <button
        onClick={handleJoin}
        className="w-full py-2.5 px-4 bg-espresso-800 hover:bg-brass-500 hover:text-espresso-950 text-crema-200 text-xs font-mono font-bold rounded-xl border border-espresso-700 hover:border-brass-500 transition-all duration-200 flex items-center justify-center gap-2"
      >
        <span>{t("explore_join")}</span>
        <AppIcon name="chevronRight" size={14} />
      </button>
    </div>
  );
}
