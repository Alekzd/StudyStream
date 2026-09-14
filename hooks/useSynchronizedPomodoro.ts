"use client";
// hooks/useSynchronizedPomodoro.ts
// StudyStream OS — Client-side Pomodoro hook with NTP-like drift compensation
//
// DESIGN: We NEVER trust client clock for state truth.
// `targetEndTime` comes from Convex server. We compute remaining time as:
//   remaining = targetEndTime - Date.now()
// This is accurate regardless of when the client joined the room.

import { useEffect, useState, useRef, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatDuration } from "@/lib/utils";

interface UseSynchronizedPomodoroOptions {
  roomId: Id<"rooms">;
  serverId: Id<"servers">;
  onWorkComplete?: () => void;
  onBreakComplete?: () => void;
}

export function useSynchronizedPomodoro({
  roomId,
  serverId,
  onWorkComplete,
  onBreakComplete,
}: UseSynchronizedPomodoroOptions) {
  const session = useQuery(api.pomodoro.getPomodoroState, { roomId });
  const startSession = useMutation(api.pomodoro.startSession);
  const pauseSession = useMutation(api.pomodoro.pauseSession);
  const skipPhase = useMutation(api.pomodoro.skipPhase);
  const resetSession = useMutation(api.pomodoro.resetSession);

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [displayTime, setDisplayTime] = useState("--:--");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const completedRef = useRef(false);

  // Re-compute remaining time on every tick using server's targetEndTime
  const updateTimer = useCallback(() => {
    if (!session || session.status === "IDLE" || session.status === "PAUSED") {
      setDisplayTime(formatDuration(session?.durationSeconds ?? 0));
      setRemainingSeconds(session?.durationSeconds ?? 0);
      return;
    }

    const remaining = Math.max(
      0,
      Math.floor((session.targetEndTime - Date.now()) / 1000)
    );
    setRemainingSeconds(remaining);
    setDisplayTime(formatDuration(remaining));

    // Trigger completion callbacks
    if (remaining === 0 && !completedRef.current) {
      completedRef.current = true;
      if (session.status === "WORK") {
        onWorkComplete?.();
      } else if (session.status === "BREAK") {
        onBreakComplete?.();
      }
    } else if (remaining > 0) {
      completedRef.current = false;
    }
  }, [session, onWorkComplete, onBreakComplete]);

  useEffect(() => {
    updateTimer();

    if (session?.status === "WORK" || session?.status === "BREAK") {
      intervalRef.current = setInterval(updateTimer, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [session, updateTimer]);

  const progressPercent =
    session?.durationSeconds && session.durationSeconds > 0
      ? ((session.durationSeconds - remainingSeconds) / session.durationSeconds) * 100
      : 0;

  return {
    session,
    displayTime,
    remainingSeconds,
    progressPercent,
    status: session?.status ?? "IDLE",
    cycleNumber: session?.cycleNumber ?? 0,
    // Control functions (only owner/mod can call these)
    startWork: (durationMinutes = 50) =>
      startSession({ roomId, serverId, phase: "WORK", durationMinutes }),
    startBreak: (durationMinutes = 10) =>
      startSession({ roomId, serverId, phase: "BREAK", durationMinutes }),
    pause: () => pauseSession({ roomId, serverId }),
    skip: () => skipPhase({ roomId, serverId }),
    reset: () => resetSession({ roomId, serverId }),
  };
}
