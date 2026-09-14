"use client";
// components/pomodoro/PomodoroTimer.tsx
// StudyStream OS — Circular Pomodoro Timer UI Component

import { useSynchronizedPomodoro } from "@/hooks/useSynchronizedPomodoro";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { useEffect, useRef } from "react";

interface PomodoroTimerProps {
  roomId: Id<"rooms">;
  serverId: Id<"servers">;
  canControl: boolean; // Only owner/moderator can control
  compact?: boolean;
}

export function PomodoroTimer({
  roomId,
  serverId,
  canControl,
  compact = false,
}: PomodoroTimerProps) {
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
      // Play Tibetan singing bowl sound
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

  // SVG circle progress
  const RADIUS = compact ? 28 : 52;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRCUMFERENCE - (progressPercent / 100) * CIRCUMFERENCE;

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900/80 rounded-full border border-neutral-700">
        <div className="relative w-8 h-8">
          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#27272a" strokeWidth="4" />
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke={isWork ? "#6366f1" : isBreak ? "#10b981" : "#404040"}
              strokeWidth="4"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
        </div>
        <span className={cn(
          "text-sm font-mono font-bold",
          isWork ? "text-indigo-400" : isBreak ? "text-green-400" : "text-neutral-500"
        )}>
          {displayTime}
        </span>
        {status !== "IDLE" && (
          <span className="text-xs text-neutral-500">
            {isWork ? "WORK" : isBreak ? "BREAK" : "PAUSED"}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      {/* Cycle indicator */}
      <div className="flex items-center gap-1">
        {Array.from({ length: Math.max(cycleNumber, 1) }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full",
              i < cycleNumber ? "bg-indigo-500" : "bg-neutral-700"
            )}
          />
        ))}
        <span className="text-xs text-neutral-500 ml-2">Chu kỳ {cycleNumber}</span>
      </div>

      {/* Circular progress ring */}
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background track */}
          <circle cx="60" cy="60" r="52" fill="none" stroke="#27272a" strokeWidth="6" />
          {/* Progress arc */}
          <circle
            cx="60" cy="60" r="52" fill="none"
            stroke={isWork ? "#6366f1" : isBreak ? "#10b981" : "#525252"}
            strokeWidth="6"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            "text-2xl font-mono font-bold",
            isWork ? "text-indigo-400" : isBreak ? "text-green-400" : "text-neutral-500"
          )}>
            {displayTime}
          </span>
          <span className="text-xs text-neutral-500 mt-0.5">
            {isWork ? "WORK" : isBreak ? "BREAK" : status === "PAUSED" ? "PAUSED" : "IDLE"}
          </span>
        </div>
      </div>

      {/* Controls (only shown to owner/moderator) */}
      {canControl && (
        <div className="flex items-center gap-2">
          {status === "IDLE" && (
            <button
              onClick={() => startWork()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Play size={14} />
              Bắt Đầu (50min)
            </button>
          )}

          {isActive && (
            <>
              <button
                onClick={() => pause()}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
                title="Tạm dừng"
              >
                <Pause size={16} />
              </button>
              <button
                onClick={() => skip()}
                className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
                title="Bỏ qua pha hiện tại"
              >
                <SkipForward size={16} />
              </button>
            </>
          )}

          {status === "PAUSED" && (
            <button
              onClick={() => startWork()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Play size={14} />
              Tiếp tục
            </button>
          )}

          {status !== "IDLE" && (
            <button
              onClick={() => reset()}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg transition-colors"
              title="Đặt lại"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
