"use client";
// components/server/ServerCard.tsx
// StudyStream OS — Server card for the Explore page

import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

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

  const handleJoin = async () => {
    try {
      const { serverId } = await joinByCode({ inviteCode: server.inviteCode });
      router.push(`/servers/${serverId}`);
    } catch (err: any) {
      console.error("Join failed:", err.message);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-600 transition-colors flex flex-col gap-3">
      <div className="flex items-center gap-3">
        {server.iconUrl ? (
          <img
            src={server.iconUrl}
            alt={server.name}
            className="w-12 h-12 rounded-xl object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-indigo-900/50 border border-indigo-700/30 flex items-center justify-center text-xl font-bold text-indigo-400">
            {server.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-100 truncate">{server.name}</h3>
          <p className="text-xs text-neutral-500">
            ⏱️ {server.defaultPomodoroWork}/{server.defaultPomodoroBreak}min cycle
          </p>
        </div>
      </div>

      {server.description && (
        <p className="text-sm text-neutral-400 line-clamp-2">{server.description}</p>
      )}

      <button
        onClick={handleJoin}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Tham Gia →
      </button>
    </div>
  );
}
