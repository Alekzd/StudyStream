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
  defaultWorkDuration?: number;
  defaultBreakDuration?: number;
  onWorkComplete?: () => void;
  onBreakComplete?: () => void;
}

export function useSynchronizedPomodoro({
  roomId,
  serverId,
  defaultWorkDuration = 50,
  defaultBreakDuration = 10,
  onWorkComplete,
  onBreakComplete,
}: UseSynchronizedPomodoroOptions) {
  const session = useQuery(api.pomodoro.getPomodoroState, { roomId });
  const startSession = useMutation(api.pomodoro.startSession);
  const pauseSession = useMutation(api.pomodoro.pauseSession);
  const resumeSession = useMutation(api.pomodoro.resumeSession);
  const skipPhase = useMutation(api.pomodoro.skipPhase);
  const autoTransitionPhase = useMutation(api.pomodoro.autoTransitionPhase);
  const resetSession = useMutation(api.pomodoro.resetSession);

  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [displayTime, setDisplayTime] = useState("--:--");
  const [transitioningStatus, setTransitioningStatus] = useState<string | null>(null);
  const [transitionCountdown, setTransitionCountdown] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCompletedPhaseRef = useRef<string | null>(null);

  // Derived state: automatically becomes false the instant session.status transitions
  const isAutoTransitioning =
    transitioningStatus !== null &&
    session?.status !== undefined &&
    transitioningStatus === session.status;

  // Re-compute remaining time on every tick using server's targetEndTime
  const updateTimer = useCallback(() => {
    if (!session || session.status === "IDLE") {
      const initialSeconds = defaultWorkDuration * 60;
      setDisplayTime(formatDuration(initialSeconds));
      setRemainingSeconds(initialSeconds);
      return;
    }

    if (session.status === "PAUSED") {
      const pausedSeconds = session.durationSeconds > 0 ? session.durationSeconds : defaultWorkDuration * 60;
      setDisplayTime(formatDuration(pausedSeconds));
      setRemainingSeconds(pausedSeconds);
      return;
    }

    const remaining = Math.max(
      0,
      Math.floor((session.targetEndTime - Date.now()) / 1000)
    );
    setRemainingSeconds(remaining);
    setDisplayTime(formatDuration(remaining));

    // Trigger completion callbacks and auto-transition after chime finishes
    if (
      remaining === 0 &&
      lastCompletedPhaseRef.current !== session.status &&
      (session.status === "WORK" || session.status === "BREAK")
    ) {
      lastCompletedPhaseRef.current = session.status;
      setTransitioningStatus(session.status);
      setTransitionCountdown(2);

      if (session.status === "WORK") {
        onWorkComplete?.();
      } else if (session.status === "BREAK") {
        onBreakComplete?.();
      }

      const activeStatus = session.status;
      setTimeout(() => setTransitionCountdown(1), 1200);

      // Auto-advance to next phase after 2.5s (allows double chime to ring out)
      setTimeout(() => {
        autoTransitionPhase({
          roomId,
          serverId,
          expectedStatus: activeStatus,
        })
          .catch(() => {})
          .finally(() => {
            setTransitioningStatus(null);
            setTransitionCountdown(null);
          });
      }, 2500);
    }
  }, [session, defaultWorkDuration, onWorkComplete, onBreakComplete, roomId, serverId, autoTransitionPhase]);

  useEffect(() => {
    const timerId = setTimeout(updateTimer, 0);

    if (session?.status === "WORK" || session?.status === "BREAK") {
      intervalRef.current = setInterval(updateTimer, 1000);
    }

    return () => {
      clearTimeout(timerId);
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
    isAutoTransitioning,
    transitionCountdown,
    // Control functions (only owner/mod can call these)
    startWork: (durationMinutes = defaultWorkDuration) =>
      startSession({ roomId, serverId, phase: "WORK", durationMinutes }),
    startBreak: (durationMinutes = defaultBreakDuration) =>
      startSession({ roomId, serverId, phase: "BREAK", durationMinutes }),
    pause: () => pauseSession({ roomId, serverId }),
    resume: () => resumeSession({ roomId, serverId }),
    skip: () => skipPhase({ roomId, serverId }),
    reset: () => resetSession({ roomId, serverId }),
  };
}
