// app/(main)/explore/page.tsx
// StudyStream OS — Explore Public Servers
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ServerCard } from "@/components/server/ServerCard";
import { CreateServerModal } from "@/components/server/CreateServerModal";

export default function ExplorePage() {
  const publicServers = useQuery(api.servers.getPublicServers, { limit: 20 });

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">
            🌐 Khám Phá Không Gian Học Tập
          </h1>
          <p className="text-neutral-400 mt-1 text-sm">
            Tham gia cộng đồng học tập hoặc tạo không gian riêng cho nhóm của bạn.
          </p>
        </div>
        <CreateServerModal />
      </div>

      {/* Server Grid */}
      <div className="flex-1 p-8">
        {publicServers === undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 rounded-xl bg-neutral-900 animate-pulse"
              />
            ))}
          </div>
        ) : publicServers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-neutral-500 text-6xl mb-4">📹</p>
            <p className="text-neutral-400 text-lg">
              Chưa có không gian học tập nào.
            </p>
            <p className="text-neutral-500 text-sm mt-2">
              Hãy là người đầu tiên tạo một không gian học tập!
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
  );
}
