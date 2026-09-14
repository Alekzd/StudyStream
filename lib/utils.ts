// lib/utils.ts
// StudyStream OS — Utility functions

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function getArchetypeLabel(archetype: string): string {
  const labels: Record<string, string> = {
    SILENT_FOCUS: "🤫 Im Lặng",
    CAM_ACCOUNTABILITY: "📹 Cam-On",
    SYNC_POMODORO: "⏱️ Pomodoro",
    AMBIENT_LOFI: "☕ Ambient",
    PAIR_SCREENSHARE: "💻 Pair Code",
    SANDBOX_TEST: "🧪 Sandbox",
  };
  return labels[archetype] ?? archetype;
}

export function getArchetypeColor(archetype: string): string {
  const colors: Record<string, string> = {
    SILENT_FOCUS: "text-blue-400",
    CAM_ACCOUNTABILITY: "text-green-400",
    SYNC_POMODORO: "text-amber-400",
    AMBIENT_LOFI: "text-purple-400",
    PAIR_SCREENSHARE: "text-cyan-400",
    SANDBOX_TEST: "text-orange-400",
  };
  return colors[archetype] ?? "text-neutral-400";
}
