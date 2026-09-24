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

export function getArchetypeLabel(archetype: string, language: "vi" | "en" = "vi"): string {
  const labelsVi: Record<string, string> = {
    SILENT_FOCUS: "Im Lặng",
    CAM_ACCOUNTABILITY: "Cam-On",
    SYNC_POMODORO: "Pomodoro",
    AMBIENT_LOFI: "Ambient",
    PAIR_SCREENSHARE: "Pair Code",
    SANDBOX_TEST: "Sandbox",
  };
  const labelsEn: Record<string, string> = {
    SILENT_FOCUS: "Silent Focus",
    CAM_ACCOUNTABILITY: "Cam Accountability",
    SYNC_POMODORO: "Sync Pomodoro",
    AMBIENT_LOFI: "Ambient",
    PAIR_SCREENSHARE: "Pair Screenshare",
    SANDBOX_TEST: "Sandbox",
  };
  const dict = language === "en" ? labelsEn : labelsVi;
  return dict[archetype] ?? archetype;
}

export function getArchetypeIcon(archetype: string): string {
  const icons: Record<string, string> = {
    SILENT_FOCUS: "micOff",
    CAM_ACCOUNTABILITY: "videoOn",
    SYNC_POMODORO: "clock",
    AMBIENT_LOFI: "coffee",
    PAIR_SCREENSHARE: "screenShare",
    SANDBOX_TEST: "flask",
  };
  return icons[archetype] ?? "coffee";
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

/**
 * Strips leading and trailing emojis and symbols from titles
 * ensuring clean typography that does not collide or double-render with AppIcon.
 */
export function cleanTitle(title: string): string {
  if (!title) return "";
  return (
    title
      .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\uFE0F\uFE0E\s\u{1F1E6}-\u{1F1FF}]+/gu, "")
      .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\uFE0F\uFE0E\s\u{1F1E6}-\u{1F1FF}]+$/gu, "")
      .trim() || title
  );
}

/**
 * Returns a unified semantic icon name for regional study servers.
 */
export function getServerIcon(slug: string): string {
  switch (slug) {
    case "vietnam":
      return "compass";
    case "japan-korea":
      return "sparkles";
    case "north-america":
      return "laptop";
    case "europe":
      return "library";
    case "global":
    default:
      return "globe";
  }
}
