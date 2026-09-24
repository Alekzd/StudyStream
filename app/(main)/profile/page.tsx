"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { AppIcon } from "@/components/ui/Icon";
import { BannerBackground } from "@/components/ui/BannerBackground";
import { useLanguage } from "@/context/LanguageContext";
import { PageTransition, MotionButton } from "@/components/ui/motion";

export default function ProfilePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
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

  // Workaholic Heatmap Color Scale: Roasted Espresso -> Aged Brass -> Bourbon Amber Flame
  const getHeatmapColor = (mins: number) => {
    if (mins === 0) return "bg-espresso-850/80 border border-espresso-700/40";
    if (mins < 25) return "bg-espresso-750 text-brass-400 border border-brass-500/30";
    if (mins < 60) return "bg-brass-600 text-crema-50";
    if (mins < 120) return "bg-bourbon-500 text-crema-50 shadow-sm";
    return "bg-bourbon-400 text-espresso-950 font-bold shadow-md";
  };

  return (
    <BannerBackground opacity={0.25}>
      <PageTransition className="flex flex-col h-full overflow-y-auto p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full select-none pb-safe-nav md:pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <MotionButton
            variant="surface"
            size="icon"
            onClick={() => router.push("/explore")}
            className="shrink-0"
          >
            <AppIcon name="arrowLeft" size={18} />
          </MotionButton>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-crema-100 flex items-center gap-2 font-sans tracking-tight">
              {t("profile_title")}
            </h1>
            <p className="text-crema-400 text-xs sm:text-sm mt-0.5 max-w-lg leading-relaxed">
              {t("profile_subtitle")}
            </p>
          </div>
        </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 sm:gap-4 mb-8">
          {/* Streak Card */}
          <div className="bg-espresso-900 border border-espresso-700/80 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-bourbon-500/10 border border-bourbon-500/30 flex items-center justify-center text-bourbon-500 shrink-0">
              <AppIcon name="flame" size={26} />
            </div>
            <div>
              <p className="text-[11px] font-mono font-semibold text-crema-600 uppercase tracking-wider">
                {t("profile_streak_days")}
              </p>
              <h3 className="text-2xl sm:text-3xl font-mono font-bold text-crema-100 mt-0.5 tabular-nums">
                {streakCount}{" "}
                <span className="text-xs sm:text-sm font-normal text-crema-400 font-sans">
                  {t("profile_days_unit")}
                </span>
              </h3>
            </div>
          </div>

          {/* Hours Card */}
          <div className="bg-espresso-900 border border-espresso-700/80 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-sm">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-brass-500/10 border border-brass-500/30 flex items-center justify-center text-brass-400 shrink-0">
              <AppIcon name="clock" size={26} />
            </div>
            <div>
              <p className="text-[11px] font-mono font-semibold text-crema-600 uppercase tracking-wider">
                {t("profile_total_hours")}
              </p>
              <h3 className="text-2xl sm:text-3xl font-mono font-bold text-crema-100 mt-0.5 tabular-nums">
                {totalHours}{" "}
                <span className="text-xs sm:text-sm font-normal text-crema-400 font-sans">
                  {t("profile_hours_unit")}
                </span>
              </h3>
            </div>
          </div>

          {/* Rank Badge Card */}
          <div className="bg-espresso-900 border border-espresso-700/80 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-sm sm:col-span-2 md:col-span-1">
            <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-2xl bg-patina-500/10 border border-patina-500/30 flex items-center justify-center text-patina-400 shrink-0">
              <AppIcon name="trophy" size={26} />
            </div>
            <div>
              <p className="text-[11px] font-mono font-semibold text-crema-600 uppercase tracking-wider">
                {t("profile_level")}
              </p>
              <h3 className="text-lg sm:text-xl font-bold text-crema-100 mt-0.5 truncate max-w-[160px]">
                {streakCount > 14
                  ? (language === "vi" ? "Kỷ luật cao" : "Consistent")
                  : streakCount > 3
                    ? (language === "vi" ? "Chăm chỉ" : "Dedicated")
                    : (language === "vi" ? "Mới bắt đầu" : "Beginner")}
              </h3>
            </div>
          </div>
        </div>

        {/* Heatmap Section */}
        <div className="bg-espresso-900 border border-espresso-700/80 rounded-2xl p-4 sm:p-6 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <AppIcon name="calendar" size={18} className="text-brass-500" />
              <h2 className="font-bold text-sm sm:text-base text-crema-100">
                {t("profile_heatmap_title")}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-crema-600">
              <span>Less</span>
              <div className="w-2.5 h-2.5 rounded-sm bg-espresso-850 border border-espresso-700/40" />
              <div className="w-2.5 h-2.5 rounded-sm bg-brass-600" />
              <div className="w-2.5 h-2.5 rounded-sm bg-bourbon-500" />
              <div className="w-2.5 h-2.5 rounded-sm bg-bourbon-400" />
              <span>More</span>
            </div>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-[560px]">
              {days.map((day, idx) => (
                <div
                  key={idx}
                  title={`${day.dateStr}: ${day.minutes} mins`}
                  className={cn(
                    "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[4px] transition-all cursor-pointer hover:scale-125",
                    getHeatmapColor(day.minutes)
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard Section */}
        <div className="bg-espresso-900 border border-espresso-700/80 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <AppIcon name="medal" size={18} className="text-bourbon-500" />
            <h2 className="font-bold text-sm sm:text-base text-crema-100">
              {t("profile_leaderboard_title")}
            </h2>
          </div>

          <div className="space-y-2">
            {leaderboard?.map((user, idx) => (
              <div
                key={user._id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-colors",
                  idx === 0
                    ? "bg-espresso-850 border-brass-500/40"
                    : "bg-espresso-850/40 border-espresso-700/60"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "w-6 text-center font-mono font-bold text-xs",
                    idx === 0 ? "text-brass-400" : idx === 1 ? "text-crema-200" : idx === 2 ? "text-bourbon-400" : "text-crema-600"
                  )}>
                    #{idx + 1}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-espresso-750 flex items-center justify-center font-bold text-xs text-brass-400 border border-espresso-700">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-xs sm:text-sm text-crema-100 truncate max-w-[140px] sm:max-w-[200px]">
                    {user.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-bourbon-400 tabular-nums">
                  <AppIcon name="flame" size={14} />
                  <span>{user.streakCount} {t("profile_days_unit")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageTransition>
    </BannerBackground>
  );
}
