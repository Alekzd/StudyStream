"use client";

import { useState, useRef, useEffect } from "react";
import { useSynchronizedPomodoro } from "@/hooks/useSynchronizedPomodoro";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { AppIcon } from "@/components/ui/Icon";
import { useLanguage } from "@/context/LanguageContext";
import { MotionButton } from "@/components/ui/motion";

interface PomodoroTimerProps {
  roomId: Id<"rooms">;
  serverId: Id<"servers">;
  canControl: boolean;
  compact?: boolean;
  cadence?: string;
}

// Resonant Double-ring Chime Synthesizer ("beep beep / rung chuông 2 lần")
function playPomodoroDoubleChime(type: "work_complete" | "break_complete" = "work_complete") {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const ring = (timeOffset: number, baseFreq: number, harmonicFreq: number, vol: number) => {
      // Primary chime tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(baseFreq, ctx.currentTime + timeOffset);
      gain1.gain.setValueAtTime(0.001, ctx.currentTime + timeOffset);
      gain1.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + timeOffset + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + timeOffset + 0.95);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime + timeOffset);
      osc1.stop(ctx.currentTime + timeOffset + 0.95);

      // Crystalline overtone sparkle (bell resonance)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(harmonicFreq, ctx.currentTime + timeOffset);
      gain2.gain.setValueAtTime(0.001, ctx.currentTime + timeOffset);
      gain2.gain.exponentialRampToValueAtTime(vol * 0.35, ctx.currentTime + timeOffset + 0.015);
      gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + timeOffset + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + timeOffset);
      osc2.stop(ctx.currentTime + timeOffset + 0.65);
    };

    if (type === "work_complete") {
      // Ring 1: First Ding! (A5 880Hz + 1760Hz)
      ring(0, 880, 1760, 0.45);
      // Ring 2: Second Ding! (C6 1046.5Hz + 2093Hz) - 280ms later
      ring(0.28, 1046.5, 2093, 0.5);
    } else {
      // Transition from Break back to Work: Welcoming double gong
      ring(0, 587.33, 1174.66, 0.4);
      ring(0.3, 783.99, 1567.98, 0.45);
    }
  } catch (err) {
    console.error("Failed to play Pomodoro chime:", err);
  }
}

export function PomodoroTimer({
  roomId,
  serverId,
  canControl,
  compact = false,
  cadence = "50/10",
}: PomodoroTimerProps) {
  const { t, language } = useLanguage();
  const isVi = language === "vi";
  const updateFocusStats = useMutation(api.users.updateFocusStats);
  const updateRoomCadence = useMutation(api.rooms.updateRoomCadence);

  const [isStationOpen, setIsStationOpen] = useState(false);
  const stationRef = useRef<HTMLDivElement | null>(null);

  // Active Cadence state: derived from override, prop, or local storage
  const [cadenceOverride, setCadenceOverride] = useState<string | null>(null);
  const currentCadence = cadenceOverride || cadence || (typeof window !== "undefined" ? localStorage.getItem("studystream_default_cadence") || "50/10" : "50/10");

  useEffect(() => {
    const handleCadenceChange = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setCadenceOverride(customEvent.detail);
      }
    };
    window.addEventListener("studystream_cadence_changed", handleCadenceChange);
    return () => window.removeEventListener("studystream_cadence_changed", handleCadenceChange);
  }, []);

  const handleSwitchCadence = async (newCadence: string) => {
    setCadenceOverride(newCadence);
    if (typeof window !== "undefined") {
      localStorage.setItem("studystream_default_cadence", newCadence);
      window.dispatchEvent(new CustomEvent("studystream_cadence_changed", { detail: newCadence }));
    }
    if (canControl) {
      try {
        await updateRoomCadence({ roomId, cadence: newCadence });
      } catch (err) {
        console.error("Failed to update room cadence:", err);
      }
    }
  };

  const [cadenceWork, cadenceBreak] = currentCadence.split("/").map((v) => parseInt(v, 10));
  const workDuration = cadenceWork || 50;
  const breakDuration = cadenceBreak || 10;

  const {
    displayTime,
    progressPercent,
    status,
    cycleNumber,
    isAutoTransitioning,
    transitionCountdown,
    startWork,
    pause,
    resume,
    skip,
    reset,
  } = useSynchronizedPomodoro({
    roomId,
    serverId,
    defaultWorkDuration: workDuration,
    defaultBreakDuration: breakDuration,
    onWorkComplete: () => {
      // 1. Play double-ring bell chime ("beep beep / rung chuông 2 lần")
      playPomodoroDoubleChime("work_complete");
      // 2. Record completed sprint into focusLogs and streak
      updateFocusStats({
        durationMinutes: workDuration,
        roomId,
        serverId,
      }).catch((err: unknown) => {
        console.error("Failed to log focus stats:", err);
      });
    },
    onBreakComplete: () => {
      // Play welcoming transition double gong
      playPomodoroDoubleChime("break_complete");
    },
  });

  // Handle outside clicks for popover
  useEffect(() => {
    if (!isStationOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (stationRef.current && !stationRef.current.contains(e.target as Node)) {
        setIsStationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isStationOpen]);

  const isActive = status === "WORK" || status === "BREAK";
  const isWork = status === "WORK";
  const isBreak = status === "BREAK";

  // SVG Chronograph circle geometry
  const RADIUS = compact ? 26 : 52;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE - (progressPercent / 100) * CIRCUMFERENCE;

  // Status color mappings with auto-transition highlight
  const strokeColor = isAutoTransitioning
    ? "#dfba89"
    : isWork
    ? "#e07a38"
    : isBreak
    ? "#4e7a66"
    : status === "PAUSED"
    ? "#c89d5c"
    : "#382e27";

  const textColor = isAutoTransitioning
    ? "text-brass-300 animate-pulse"
    : isWork
    ? "text-bourbon-500"
    : isBreak
    ? "text-patina-400"
    : status === "PAUSED"
    ? "text-brass-400"
    : "text-crema-600";

  const statusLabel = isAutoTransitioning
    ? isVi
      ? isWork
        ? `🎉 Nghỉ sau ${transitionCountdown ?? 2}s`
        : `⚡ Học sau ${transitionCountdown ?? 2}s`
      : isWork
      ? `🎉 Break in ${transitionCountdown ?? 2}s`
      : `⚡ Sprint in ${transitionCountdown ?? 2}s`
    : isWork
    ? t("pomo_work")
    : isBreak
    ? t("pomo_break")
    : status === "PAUSED"
    ? t("pomo_paused")
    : t("pomo_idle");

  if (compact) {
    return (
      <div className="relative flex items-center gap-1.5" ref={stationRef}>
        {/* Clickable Timer Chip with auto-transition pulse */}
        <button
          type="button"
          onClick={() => setIsStationOpen((v) => !v)}
          aria-label={isVi ? "Bảng điều khiển Pomodoro" : "Pomodoro controls"}
          className={cn(
            "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border shadow-sm transition-all select-none cursor-pointer",
            isAutoTransitioning
              ? "bg-brass-950/70 border-brass-400 ring-2 ring-brass-400/50 scale-[1.02] animate-pulse"
              : isStationOpen
              ? "bg-espresso-800 border-brass-500/70 ring-1 ring-brass-500/30"
              : "bg-espresso-900/90 border-espresso-700/80 hover:bg-espresso-850 hover:border-espresso-600"
          )}
          title={isVi ? "Nhấp để mở bảng điều khiển Pomodoro" : "Click to toggle Pomodoro controls"}
        >
          <div className="relative w-4 h-4 sm:w-5 sm:h-5 shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 -rotate-90" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="26" fill="none" stroke="#221c17" strokeWidth="6" />
              <circle
                cx="30" cy="30" r="26" fill="none"
                stroke={strokeColor}
                strokeWidth="6"
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
          <span className="hidden sm:inline text-[10px] font-mono tracking-wider font-semibold text-crema-600 uppercase">
            {statusLabel}
          </span>
          <AppIcon
            name="sliders"
            size={12}
            className={cn("transition-colors ml-0.5 hidden xs:inline sm:inline", isStationOpen ? "text-brass-400" : "text-crema-600")}
          />
        </button>

        {/* Quick Inline Action Buttons & Cadence Pills (when user has control permission) */}
        {canControl && (
          <div className="flex items-center gap-1 shrink-0">
            {status === "IDLE" && (
              <div className="flex items-center gap-1">
                {/* Cadence Quick Switcher Pills */}
                <div className="hidden sm:flex items-center bg-espresso-950/80 p-0.5 rounded-lg border border-espresso-750/70">
                  {[
                    { label: "25m", val: "25/5" },
                    { label: "50m", val: "50/10" },
                    { label: "90m", val: "90/20" },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => handleSwitchCadence(p.val)}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer",
                        currentCadence === p.val
                          ? "bg-brass-500 text-espresso-950 shadow-sm"
                          : "text-crema-500 hover:text-crema-200"
                      )}
                      title={`Cadence: ${p.val}`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => startWork(workDuration)}
                  className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-brass-500 hover:bg-brass-400 text-espresso-950 transition-colors shadow-sm cursor-pointer shrink-0"
                  title={`${isVi ? "Bắt đầu học" : "Start sprint"} (${workDuration}m)`}
                >
                  <AppIcon name="play" size={13} />
                  <span className="hidden sm:inline">Start ({workDuration}m)</span>
                </button>
              </div>
            )}

            {isActive && (
              <>
                <button
                  type="button"
                  onClick={() => pause()}
                  className="p-1.5 rounded-lg text-crema-200 hover:bg-espresso-800 bg-espresso-850/80 border border-espresso-700/80 transition-colors cursor-pointer"
                  title={t("pomo_pause")}
                >
                  <AppIcon name="pause" size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => skip()}
                  className="p-1.5 rounded-lg text-crema-400 hover:text-crema-100 hover:bg-espresso-800 bg-espresso-850/80 border border-espresso-700/80 transition-colors cursor-pointer"
                  title={t("pomo_skip")}
                >
                  <AppIcon name="skip" size={14} />
                </button>
              </>
            )}

            {status === "PAUSED" && (
              <>
                <button
                  type="button"
                  onClick={() => resume()}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-brass-500 hover:bg-brass-400 text-espresso-950 transition-colors shadow-sm cursor-pointer"
                  title={t("pomo_resume")}
                >
                  <AppIcon name="play" size={13} />
                  <span className="hidden sm:inline">{t("pomo_resume")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => reset()}
                  className="p-1.5 rounded-lg text-crema-400 hover:text-crema-100 hover:bg-espresso-800 bg-espresso-850/80 border border-espresso-700/80 transition-colors cursor-pointer"
                  title={t("pomo_reset")}
                >
                  <AppIcon name="restart" size={14} />
                </button>
              </>
            )}
          </div>
        )}

        {/* Dropdown Station Popover */}
        {isStationOpen && (
          <div className="absolute top-full right-0 mt-2 w-80 bg-espresso-900/95 border border-brass-500/40 shadow-2xl rounded-2xl p-4 text-crema-100 z-50 animate-pip-in backdrop-blur-md select-none">
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-3 border-b border-espresso-750/70 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-espresso-800 border border-espresso-700 flex items-center justify-center text-brass-400">
                  <AppIcon name="clock" size={13} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-crema-100">
                    {isVi ? "Trạm Pomodoro Đồng Bộ" : "Synchronized Pomodoro"}
                  </h4>
                  <p className="text-[10px] font-mono text-crema-500">
                    {currentCadence} • {t("pomo_cycle")} #{Math.max(cycleNumber, 1)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsStationOpen(false)}
                className="text-crema-500 hover:text-crema-200 p-1 rounded-md cursor-pointer"
                aria-label={isVi ? "Đóng bảng điều khiển" : "Close controls"}
              >
                <AppIcon name="close" size={14} />
              </button>
            </div>

            {/* Auto Transitioning Banner */}
            {isAutoTransitioning && (
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-brass-500/15 border border-brass-500/50 text-brass-300 text-xs font-mono animate-pop-in mb-3">
                <span className="text-base animate-bounce">
                  {isWork ? "🎉" : "☕"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-crema-100">
                    {isWork
                      ? (isVi ? "Hoàn thành phiên học!" : "Sprint Complete!")
                      : (isVi ? "Kết thúc giờ nghỉ!" : "Break Finished!")}
                  </p>
                  <p className="text-[11px] text-crema-400">
                    {isVi
                      ? `Tự động chuyển sang ${isWork ? "nghỉ ngơi" : "học tập"} sau ${transitionCountdown ?? 2}s...`
                      : `Auto-advancing to ${isWork ? "break" : "sprint"} in ${transitionCountdown ?? 2}s...`}
                  </p>
                </div>
              </div>
            )}

            {/* Middle Countdown Display */}
            <div className="flex flex-col items-center justify-center py-2">
              <span className={cn("text-3xl font-mono font-bold tabular-nums tracking-tight", textColor)}>
                {displayTime}
              </span>
              <span className="text-[10px] font-mono font-semibold tracking-widest text-crema-500 uppercase mt-0.5">
                {statusLabel}
              </span>
            </div>

            {/* Quick Sprint Presets (Cadence selector) */}
            {canControl && (
              <div className="my-3 pt-2 border-t border-espresso-750/50">
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-crema-500 mb-1.5">
                  {isVi ? "Cài đặt nhịp Pomodoro (Cadence)" : "Select Pomodoro Cadence"}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { minutes: 25, label: "25m", cadenceVal: "25/5", sub: isVi ? "Cổ điển (25/5)" : "Classic (25/5)" },
                    { minutes: 50, label: "50m", cadenceVal: "50/10", sub: isVi ? "Chuẩn (50/10)" : "Deep (50/10)" },
                    { minutes: 90, label: "90m", cadenceVal: "90/20", sub: isVi ? "Sâu (90/20)" : "Ultra (90/20)" },
                  ].map((preset) => (
                    <button
                      key={preset.minutes}
                      type="button"
                      onClick={() => handleSwitchCadence(preset.cadenceVal)}
                      className={cn(
                        "p-2 rounded-xl border text-center transition-all cursor-pointer",
                        currentCadence === preset.cadenceVal
                          ? "bg-espresso-800 border-brass-500 text-brass-300 font-bold ring-1 ring-brass-500/40"
                          : "bg-espresso-850/60 border-espresso-750 hover:bg-espresso-800 text-crema-200"
                      )}
                    >
                      <div className="text-xs font-mono font-bold">{preset.label}</div>
                      <div className="text-[9px] text-crema-400 font-mono mt-0.5">{preset.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Station Action Buttons */}
            {canControl && (
              <div className="flex items-center gap-2 pt-2 border-t border-espresso-750/50">
                {status === "IDLE" && (
                  <MotionButton
                    variant="brass"
                    size="sm"
                    className="w-full"
                    onClick={() => startWork(workDuration)}
                    leftIcon={<AppIcon name="play" size={14} />}
                  >
                    <span>{t("pomo_start_sprint")} ({workDuration}m)</span>
                  </MotionButton>
                )}

                {isActive && (
                  <>
                    <MotionButton
                      variant="surface"
                      size="sm"
                      className="flex-1"
                      onClick={() => pause()}
                      leftIcon={<AppIcon name="pause" size={14} />}
                    >
                      <span>{t("pomo_pause")}</span>
                    </MotionButton>
                    <MotionButton
                      variant="surface"
                      size="sm"
                      className="flex-1"
                      onClick={() => skip()}
                      leftIcon={<AppIcon name="skip" size={14} />}
                    >
                      <span>{t("pomo_skip")}</span>
                    </MotionButton>
                  </>
                )}

                {status === "PAUSED" && (
                  <>
                    <MotionButton
                      variant="brass"
                      size="sm"
                      className="flex-1"
                      onClick={() => resume()}
                      leftIcon={<AppIcon name="play" size={14} />}
                    >
                      <span>{t("pomo_resume")}</span>
                    </MotionButton>
                    <MotionButton
                      variant="surface"
                      size="sm"
                      className="flex-1"
                      onClick={() => reset()}
                      leftIcon={<AppIcon name="restart" size={14} />}
                    >
                      <span>{t("pomo_reset")}</span>
                    </MotionButton>
                  </>
                )}

                {status !== "IDLE" && status !== "PAUSED" && (
                  <button
                    type="button"
                    onClick={() => reset()}
                    className="p-2 rounded-xl bg-espresso-850 hover:bg-espresso-800 text-crema-400 hover:text-crema-100 border border-espresso-700 transition-colors cursor-pointer"
                    title={t("pomo_reset")}
                  >
                    <AppIcon name="restart" size={15} />
                  </button>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    );
  }

  // Non-compact view (rendered in full page / standalone containers)
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

      {/* Auto Transition Banner */}
      {isAutoTransitioning && (
        <div className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-brass-500/15 border border-brass-500/50 text-brass-300 text-xs font-mono animate-pop-in">
          <span className="text-base animate-bounce">{isWork ? "🎉" : "☕"}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-crema-100">
              {isWork ? (isVi ? "Hoàn thành hiệp học tập!" : "Sprint Complete!") : (isVi ? "Kết thúc giờ giải lao!" : "Break Finished!")}
            </p>
            <p className="text-[11px] text-crema-400">
              {isVi ? `Chuyển ca tự động sau ${transitionCountdown ?? 2}s...` : `Auto-advancing in ${transitionCountdown ?? 2}s...`}
            </p>
          </div>
        </div>
      )}

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
            <MotionButton
              variant="bourbon"
              size="sm"
              onClick={() => startWork(workDuration)}
              leftIcon={<AppIcon name="play" size={14} />}
            >
              {t("pomo_start_sprint")} ({workDuration}m)
            </MotionButton>
          )}

          {isActive && (
            <>
              <MotionButton
                variant="surface"
                size="icon"
                onClick={() => pause()}
                title={t("pomo_pause")}
              >
                <AppIcon name="pause" size={16} />
              </MotionButton>
              <MotionButton
                variant="surface"
                size="icon"
                onClick={() => skip()}
                title={t("pomo_skip")}
              >
                <AppIcon name="skip" size={16} />
              </MotionButton>
            </>
          )}

          {status === "PAUSED" && (
            <MotionButton
              variant="brass"
              size="sm"
              onClick={() => resume()}
              leftIcon={<AppIcon name="play" size={14} />}
            >
              {t("pomo_resume")}
            </MotionButton>
          )}

          {status !== "IDLE" && (
            <MotionButton
              variant="surface"
              size="icon"
              onClick={() => reset()}
              title={t("pomo_reset")}
            >
              <AppIcon name="restart" size={16} />
            </MotionButton>
          )}
        </div>
      )}

      {/* Chime Bell Synthesizer Test */}
      <div className="pt-2 border-t border-espresso-750/50 w-full">
        <button
          type="button"
          onClick={() => playPomodoroDoubleChime("work_complete")}
          className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-xl bg-espresso-850 hover:bg-espresso-800 border border-espresso-750 text-xs font-mono text-crema-300 transition-colors cursor-pointer"
        >
          <AppIcon name="bell" size={14} className="text-brass-400" />
          <span>{isVi ? "Thử rung chuông 2 lần (Beep)" : "Test Double Chime (2 Rings)"}</span>
        </button>
      </div>
    </div>
  );
}
