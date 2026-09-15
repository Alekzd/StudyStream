"use client";
// app/(main)/profile/page.tsx
// StudyStream OS — Focus Profile, Streak Engine & Heatmap Analytics

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Flame, Clock, Trophy, Award, Calendar, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const currentUser = useQuery(api.users.getCurrentUser);
  const focusLogs = useQuery(api.users.getMyFocusLogs, { limit: 90 });
  const leaderboard = useQuery(api.users.getStreakLeaderboard, { limit: 10 });

  const totalHours = currentUser
    ? (currentUser.totalFocusMinutes / 60).toFixed(1)
    : "0.0";
  const streakCount = currentUser?.streakCount ?? 0;

  // Generate last 12 weeks of days for heatmap
  const days: { dateStr: string; dayOfWeek: number; minutes: number }[] = [];
  const logMap = new Map<string, number>();
  focusLogs?.forEach((l) => {
    logMap.set(l.dateString, l.durationMinutes);
  });

  const now = new Date();
  for (let i = 83; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    days.push({
      dateStr,
      dayOfWeek: d.getDay(),
      minutes: logMap.get(dateStr) ?? 0,
    });
  }

  const getHeatmapColor = (mins: number) => {
    if (mins === 0) return "bg-neutral-800/80";
    if (mins < 25) return "bg-indigo-950 text-indigo-400 border border-indigo-800/50";
    if (mins < 60) return "bg-indigo-800 text-indigo-200";
    if (mins < 120) return "bg-indigo-600 text-white";
    return "bg-indigo-400 text-black";
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/explore")}
          className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-100 flex items-center gap-2">
            Hồ Sơ Năng Suất & Chuỗi Học Tập
          </h1>
          <p className="text-neutral-400 text-sm mt-0.5">
            Theo dõi tiến trình rèn luyện tính kỷ luật và thời gian tập trung sâu.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame size={28} />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Chuỗi Ngày Học Liên Tục
            </p>
            <h3 className="text-3xl font-bold text-neutral-100 mt-0.5">
              {streakCount} <span className="text-base font-normal text-neutral-400">ngày</span>
            </h3>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Clock size={28} />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Tổng Giờ Tập Trung Tích Lũy
            </p>
            <h3 className="text-3xl font-bold text-neutral-100 mt-0.5">
              {totalHours} <span className="text-base font-normal text-neutral-400">giờ</span>
            </h3>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
            <Award size={28} />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Huy Hiệu Học Viên
            </p>
            <h3 className="text-lg font-bold text-neutral-100 mt-0.5">
              {streakCount >= 30
                ? "🏆 Huyền Thoại Focus"
                : streakCount >= 7
                ? "⚡ Học Viên Kỷ Luật"
                : "🌱 Học Viên Khởi Động"}
            </h3>
          </div>
        </div>
      </div>

      {/* GitHub-style Activity Heatmap */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-200 text-sm flex items-center gap-2">
            <Calendar size={16} className="text-indigo-400" />
            Biểu Đồ Nhiệt Tập Trung (12 Tuần Vừa Qua)
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span>Ít</span>
            <div className="w-3 h-3 rounded bg-neutral-800" />
            <div className="w-3 h-3 rounded bg-indigo-950" />
            <div className="w-3 h-3 rounded bg-indigo-800" />
            <div className="w-3 h-3 rounded bg-indigo-600" />
            <div className="w-3 h-3 rounded bg-indigo-400" />
            <span>Nhiều</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {Array.from({ length: 12 }).map((_, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1.5">
              {Array.from({ length: 7 }).map((_, dayIdx) => {
                const dayData = days[weekIdx * 7 + dayIdx];
                if (!dayData) return null;

                return (
                  <div
                    key={dayData.dateStr}
                    title={`${dayData.dateStr}: ${dayData.minutes} phút tập trung`}
                    className={cn(
                      "w-4 h-4 rounded-sm transition-transform hover:scale-125 cursor-pointer",
                      getHeatmapColor(dayData.minutes)
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h3 className="font-semibold text-neutral-200 text-sm flex items-center gap-2 mb-4">
          <Trophy size={16} className="text-amber-400" />
          Bảng Vinh Danh Top Học Viên Chăm Chỉ
        </h3>

        <div className="divide-y divide-neutral-800">
          {leaderboard?.map((u, idx) => (
            <div
              key={u._id}
              className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-neutral-800/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "w-6 text-center font-bold text-sm",
                    idx === 0
                      ? "text-amber-400"
                      : idx === 1
                      ? "text-slate-300"
                      : idx === 2
                      ? "text-amber-700"
                      : "text-neutral-500"
                  )}
                >
                  #{idx + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-neutral-200">
                    {u.name || "Anonymous Scholar"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {(u.totalFocusMinutes / 60).toFixed(0)} giờ học tích lũy
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 text-amber-400 font-mono text-sm font-semibold">
                <Flame size={16} />
                {u.streakCount} ngày
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
