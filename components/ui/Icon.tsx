"use client";

import React from "react";
import { Icon as IconifyIcon } from "@iconify/react";

/**
 * StudyStream OS — Unified Semantic Icon Registry
 * Standardized on high-clarity Phosphor (`ph:`) and Solar (`solar:`) icon collections.
 * Every single entry has been verified against installed icon packages (@iconify-json/ph, @iconify-json/solar).
 */
export const ICON_MAP = {
  // ── Coffee, Lounge & Atelier Aesthetics ───────────────────
  coffee: "solar:cup-hot-bold",
  coffeeAlt: "ph:coffee-duotone",
  jazz: "ph:disc-duotone",
  saxophone: "ph:music-notes-duotone",
  music: "solar:music-notes-bold",
  vinyl: "ph:vinyl-record-bold",
  book: "solar:book-2-bold",
  notebook: "solar:notebook-bold",
  bookmark: "solar:bookmark-bold",
  library: "solar:library-bold",
  graduation: "ph:graduation-cap-bold",

  // ── Productivity, Streaks & Chronograph ──────────────────
  flame: "solar:flame-bold",
  streak: "solar:fire-bold",
  clock: "solar:clock-circle-bold",
  timer: "solar:stopwatch-bold",
  hourglass: "solar:hourglass-line-bold",
  trophy: "solar:cup-first-bold",
  medal: "solar:medal-ribbon-bold",
  calendar: "solar:calendar-date-bold",
  target: "solar:target-bold",
  chart: "solar:chart-2-bold",
  bolt: "solar:bolt-bold",

  // ── Audio, Nature & Ambient Soundscape ────────────────────
  headphones: "solar:headphones-round-sound-bold",
  soundwave: "solar:soundwave-bold",
  volumeUp: "solar:volume-loud-bold",
  volumeDown: "solar:volume-small-bold",
  volumeMute: "solar:volume-cross-bold",
  sliders: "solar:tuning-square-2-bold",
  sparkles: "ph:sparkle-fill",
  rain: "solar:cloud-rain-bold",
  fire: "solar:fire-bold",
  fireplace: "solar:fire-bold",
  wind: "solar:wind-bold",
  radio: "solar:radio-bold",
  equalizer: "solar:soundwave-square-bold",

  // ── Video, Room & LiveKit Media Controls ──────────────────
  videoOn: "solar:videocamera-record-bold",
  videoOff: "ph:video-camera-slash-bold",
  micOn: "solar:microphone-3-bold",
  micOff: "ph:microphone-slash-bold",
  screenShare: "solar:screencast-bold",
  maximize: "solar:maximize-square-bold",
  minimize: "solar:minimize-square-bold",
  pin: "solar:pin-bold",
  expand: "ph:arrows-out-bold",
  collapse: "ph:arrows-in-bold",
  logout: "solar:logout-2-bold",
  users: "solar:users-group-two-rounded-bold",
  user: "solar:user-bold",
  userCheck: "solar:user-check-bold",
  userPlus: "solar:user-plus-bold",
  lock: "solar:lock-bold",
  unlock: "solar:lock-unlocked-bold",
  eye: "solar:eye-bold",
  eyeClosed: "solar:eye-closed-bold",
  flask: "solar:test-tube-minimalistic-bold",
  globe: "solar:globe-bold",
  shield: "solar:shield-check-bold",
  key: "solar:key-bold",
  crown: "solar:crown-bold",
  camera: "solar:camera-bold",

  // ── Controls, Chat & Navigation ───────────────────────────
  play: "solar:play-bold",
  pause: "solar:pause-bold",
  skip: "solar:skip-next-bold",
  restart: "solar:restart-bold",
  refresh: "solar:refresh-bold",
  compass: "solar:compass-bold",
  plus: "solar:add-circle-bold",
  close: "solar:close-circle-bold",
  send: "ph:paper-plane-right-fill",
  chat: "solar:chat-round-dots-bold",
  message: "solar:chat-round-dots-bold",
  settings: "solar:settings-minimalistic-bold",
  chevronRight: "solar:alt-arrow-right-bold",
  chevronLeft: "solar:alt-arrow-left-bold",
  chevronDown: "solar:alt-arrow-down-bold",
  chevronUp: "solar:alt-arrow-up-bold",
  arrowLeft: "solar:arrow-left-bold",
  arrowRight: "solar:arrow-right-bold",
  menu: "solar:hamburger-menu-bold",
  spinner: "ph:spinner-gap-bold",
  check: "solar:check-circle-bold",
  search: "solar:magnifier-bold",
  filter: "solar:filter-bold",
  grid: "ph:grid-four-bold",
  copy: "solar:copy-bold",
  share: "solar:share-circle-bold",
  externalLink: "ph:arrow-square-out-bold",
  trash: "solar:trash-bin-trash-bold",
  delete: "solar:trash-bin-trash-bold",
  edit: "solar:pen-new-square-bold",
  info: "solar:info-circle-bold",
  alert: "solar:danger-triangle-bold",
  warning: "solar:danger-triangle-bold",
  help: "solar:question-circle-bold",
  bell: "solar:bell-bold",
  bellOff: "solar:bell-off-bold",
  hash: "ph:hash-bold",
  link: "solar:link-round-bold",
  heart: "solar:heart-bold",
  star: "solar:star-bold",
  folder: "solar:folder-bold",
  file: "solar:file-bold",
  download: "solar:download-square-bold",
  upload: "solar:upload-square-bold",
  sun: "solar:sun-2-bold",
  moon: "solar:moon-bold",
  laptop: "solar:laptop-bold",
  monitor: "solar:monitor-bold",
  phone: "solar:smartphone-bold",

  // ── Brand, Platform & Community Logos ─────────────────────
  discord: "ph:discord-logo-fill",
  google: "ph:google-logo-bold",
  github: "ph:github-logo-fill",
  apple: "ph:apple-logo-fill",
  spotify: "ph:spotify-logo-fill",
  youtube: "ph:youtube-logo-fill",
  twitter: "ph:x-logo-bold",
  x: "ph:x-logo-bold",
  slack: "ph:slack-logo-bold",
  notion: "ph:notion-logo-bold",
  figma: "ph:figma-logo-bold",
  twitch: "ph:twitch-logo-fill",
  telegram: "ph:telegram-logo-fill",
  meta: "ph:meta-logo-bold",
  facebook: "ph:facebook-logo-fill",
  instagram: "ph:instagram-logo-fill",
  linkedin: "ph:linkedin-logo-fill",
  reddit: "ph:reddit-logo-fill",
  openAi: "ph:open-ai-logo-bold",
  ai: "ph:sparkle-fill",
  studystream: "solar:cup-hot-bold",
  livekit: "ph:broadcast-bold",
  gitlab: "ph:gitlab-logo-simple-bold",
  codepen: "ph:codepen-logo-bold",
} as const;

export type SemanticIconName = keyof typeof ICON_MAP;

export interface AppIconProps {
  /**
   * Semantic key from ICON_MAP with auto-complete, or any valid Iconify string (e.g. 'ph:...', 'solar:...')
   */
  name: SemanticIconName | (string & {});
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

export function getResolvedIconName(name: string): string {
  const mapped = (ICON_MAP as Record<string, string>)[name];
  if (mapped) return mapped;
  if (name.includes(":")) return name;
  return "solar:cup-hot-bold";
}

export function AppIcon({ name, size = 22, className, style, title }: AppIconProps) {
  const iconString = getResolvedIconName(name);

  const iconElement = (
    <IconifyIcon
      icon={iconString}
      width={size}
      height={size}
      className={className}
      style={style}
    />
  );

  if (title) {
    return (
      <span title={title} className="inline-flex items-center justify-center leading-none">
        {iconElement}
      </span>
    );
  }

  return iconElement;
}
