"use client";

import React from "react";
import { Icon as IconifyIcon } from "@iconify/react";

// Curated Semantic Map for The Midnight Espresso & Workaholic Atelier
export const ICON_MAP = {
  // Coffee & Lounge
  coffee: "solar:cup-hot-bold",
  jazz: "ph:disc-duotone",
  saxophone: "ph:music-notes-duotone",

  // Productivity & Streaks
  flame: "solar:flame-bold",
  clock: "solar:clock-circle-bold",
  trophy: "solar:cup-first-bold",
  medal: "solar:medal-ribbon-bold",
  calendar: "solar:calendar-date-bold",
  target: "solar:target-bold",

  // Audio & Ambience
  headphones: "solar:headphones-round-sound-bold",
  soundwave: "solar:soundwave-bold",
  volumeUp: "solar:volume-loud-bold",
  volumeMute: "solar:volume-cross-bold",
  sliders: "solar:tuning-square-2-bold",
  sparkles: "solar:sparkles-bold",

  // Room & LiveKit
  videoOn: "solar:videocamera-record-bold",
  videoOff: "solar:videocamera-cross-bold",
  micOn: "solar:microphone-3-bold",
  micOff: "solar:microphone-cross-bold",
  screenShare: "solar:screencast-bold",
  maximize: "solar:maximize-square-bold",
  minimize: "solar:minimize-square-bold",
  logout: "solar:logout-2-bold",
  users: "solar:users-group-two-rounded-bold",
  lock: "solar:lock-bold",
  eye: "solar:eye-bold",
  flask: "solar:test-tube-minimalistic-bold",

  // Controls & Navigation
  play: "solar:play-bold",
  pause: "solar:pause-bold",
  skip: "solar:skip-next-bold",
  restart: "solar:restart-bold",
  compass: "solar:compass-bold",
  plus: "solar:add-circle-bold",
  close: "solar:close-circle-bold",
  send: "solar:plain-bold",
  chat: "solar:chat-round-dots-bold",
  settings: "solar:settings-minimalistic-bold",
  chevronRight: "solar:alt-arrow-right-bold",
  arrowLeft: "solar:arrow-left-bold",
  menu: "solar:hamburger-menu-bold",
} as const;

export type SemanticIconName = keyof typeof ICON_MAP;

interface AppIconProps {
  name: SemanticIconName | string;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export function AppIcon({ name, size = 20, className, style }: AppIconProps) {
  // If name matches one of our semantic keys, use curated iconify glyph
  const iconString = (ICON_MAP as Record<string, string>)[name] ?? name;

  return (
    <IconifyIcon
      icon={iconString}
      width={size}
      height={size}
      className={className}
      style={style}
    />
  );
}
