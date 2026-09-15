"use client";

import { useSynchronizedPomodoro } from "@/hooks/useSynchronizedPomodoro";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { AppIcon } from "@/components/ui/Icon";
import { useLanguage } from "@/context/LanguageContext";

interface PomodoroTimerProps {
  roomId: Id<"rooms">;
  serverId: Id<"servers">;
  canControl: boolean;
  compact?: boolean;
}

export function PomodoroTimer({
  roomId,
  serverId,
  canControl,
  compact = false,
}: PomodoroTimerProps) {
  const { t } = useLanguage();
  const {
    displayTime,
    progressPercent,
    status,
    cycleNumber,
    startWork,
    startBreak,
    pause,
    skip,
    reset,
  } = useSynchronizedPomodoro({
    roomId,
    serverId,
    onWorkComplete: () => {
      const audio = new Audio("/sounds/bowl.mp3");
      audio.play().catch(() => {});
    },
    onBreakComplete: () => {
      const audio = new Audio("/sounds/gong.mp3");
      audio.play().catch(() => {});
    },
  });

  const isActive = status === "WORK" || status === "BREAK";
  const isWork = status === "WORK";
  const isBreak = status === "BREAK";

  // SVG Chronograph circle geometry
  const RADIUS = compact ? 26 : 52;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE - (progressPercent / 100) * CIRCUMFERENCE;

  // Status color mappings (Workaholic Bourbon Amber for Sprint, Patina Green for Break, Brass for Idle)
  const strokeColor = isWork ? "#e07a38" : isBreak ? "#4e7a66" : "#382e27";
  const textColor = isWork ? "text-bourbon-500" : isBreak ? "text-patina-400" : "text-crema-600";
  const statusLabel = isWork ? t("pomo_work") : isBreak ? t("pomo_break") : status === "PAUSED" ? t("pomo_paused") : t("pomo_idle");

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1 bg-espresso-900/90 rounded-lg border border-espresso-700/80 shadow-sm select-none">
        <div className="relative w-6 h-6 shrink-0">
          <svg className="w-6 h-6 -rotate-90" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="26" fill="none" stroke="#221c17" strokeWidth="5" />
            <circle
              cx="30" cy="30" r="26" fill="none"
              stroke={strokeColor}
              strokeWidth="5"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s steps(60, end)" }}
            />
          </svg>
        </div>
        <span className={cn("text-xs md:text-sm font-mono font-bold tabular-nums tracking-tight", textColor)}>
          {displayTime}
        </span>
        <span className="hidden sm:inline text-[10px] font-mono tracking-wider font-semibold text-crema-600">
          {statusLabel}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-5 bg-espresso-900 border border-espresso-700 rounded-2xl select-none">
      {/* Cycle Indicator */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: Math.max(cycleNumber, 1) }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              i < cycleNumber ? "bg-brass-500 shadow-sm" : "bg-espresso-700"
            )}
          />
        ))}
        <span className="text-xs font-mono text-crema-400 ml-2">
          {t("pomo_cycle")} #{cycleNumber}
        </span>
      </div>

      {/* Chronograph Dial */}
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#221c17" strokeWidth="6" />
          <circle
            cx="60" cy="60" r="52" fill="none"
            stroke={strokeColor}
            strokeWidth="6"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s steps(60, end)" }}
          />
        </svg>

        {/* Center Chrono Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-2xl font-mono font-bold tabular-nums tracking-tight", textColor)}>
            {displayTime}
          </span>
          <span className="text-[10px] font-mono font-bold tracking-widest text-crema-600 mt-1 uppercase">
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Chronograph Controls */}
      {canControl && (
        <div className="flex items-center gap-2 pt-1">
          {status === "IDLE" && (
            <button
              onClick={() => startWork()}
              className="flex items-center gap-2 px-4 py-2 bg-bourbon-500 hover:bg-bourbon-600 text-crema-50 text-xs font-mono font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              <AppIcon name="play" size={14} />
              {t("pomo_start_sprint")}
            </button>
          )}

          {isActive && (
            <>
              <button
                onClick={() => pause()}
                className="p-2.5 bg-espresso-800 hover:bg-espresso-750 text-crema-200 border border-espresso-700 rounded-xl transition-colors active:scale-95"
                title={t("pomo_pause")}
              >
                <AppIcon name="pause" size={16} />
              </button>
              <button
                onClick={() => skip()}
                className="p-2.5 bg-espresso-800 hover:bg-espresso-750 text-crema-200 border border-espresso-700 rounded-xl transition-colors active:scale-95"
                title={t("pomo_skip")}
              >
                <AppIcon name="skip" size={16} />
              </button>
            </>
          )}

          {status === "PAUSED" && (
            <button
              onClick={() => startWork()}
              className="flex items-center gap-2 px-4 py-2 bg-brass-500 hover:bg-brass-600 text-espresso-950 text-xs font-mono font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              <AppIcon name="play" size={14} />
              {t("pomo_resume")}
            </button>
          )}

          {status !== "IDLE" && (
            <button
              onClick={() => reset()}
              className="p-2.5 bg-espresso-800 hover:bg-espresso-750 text-crema-400 border border-espresso-700 rounded-xl transition-colors active:scale-95"
              title={t("pomo_reset")}
            >
              <AppIcon name="restart" size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
