"use client";

import React, { useState, useEffect } from "react";
import { soundscape, AUDIO_PRESETS, type AudioPreset } from "@/lib/soundscape";
import { AppIcon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface AmbientAudioDockProps {
  onClose?: () => void;
  onOpenFullMixer?: () => void;
  className?: string;
}

export function AmbientAudioDock({
  onClose,
  onOpenFullMixer,
  className,
}: AmbientAudioDockProps) {
  const { t, language } = useLanguage();
  const isVi = language === "vi";

  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVol, setMasterVol] = useState(35);
  const [customUrl, setCustomUrl] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState("");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  useEffect(() => {
    const syncState = () => {
      setIsMuted(soundscape.getIsMuted());
      setIsPlaying(soundscape.isPlayingAny());
      setMasterVol(soundscape.getMasterVolume());
      setCustomUrl(soundscape.getCustomUrl());
      setActivePresetId(soundscape.getActivePresetId());
    };

    syncState();
    const unsub = soundscape.subscribe(syncState);
    return unsub;
  }, []);

  const handleApplyPreset = (preset: AudioPreset) => {
    soundscape.applyPreset(preset.id);
  };

  const handleMasterTogglePlay = () => {
    soundscape.togglePlayPauseAll();
  };

  const handleToggleMute = () => {
    soundscape.toggleMuteAll();
  };

  const handleSliderChange = (val: number) => {
    setMasterVol(val);
    soundscape.setMasterVolume(val);
  };

  const handlePlayCustomUrl = () => {
    if (!customInput.trim()) return;
    soundscape.setCustomAudio(customInput.trim());
    setCustomInput("");
  };

  const handleClearCustomUrl = () => {
    soundscape.setCustomAudio(null);
  };

  return (
    <div
      className={cn(
        "select-none w-80 p-3.5 rounded-2xl bg-espresso-900/95 border border-espresso-700/80 shadow-2xl backdrop-blur-md",
        "animate-pip-in flex flex-col gap-2.5 transition-spring pointer-events-auto",
        className
      )}
      role="region"
      aria-label="Ambient Audio Quick Controls"
    >
      {/* ─── Header: Ambient Audio + Mute + Play/Pause ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AppIcon name="headphones" size={17} className="text-brass-400" />
          <span className="text-sm font-semibold text-crema-100 tracking-tight">
            {t("soundscape_title")}
          </span>
          {isPlaying && (
            <span className="flex items-end gap-0.5 h-2.5 shrink-0 px-0.5">
              <span className="w-0.5 h-2 bg-brass-400 rounded-full animate-pulse" />
              <span className="w-0.5 h-3 bg-brass-400 rounded-full animate-pulse delay-75" />
              <span className="w-0.5 h-1.5 bg-brass-400 rounded-full animate-pulse delay-150" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Mute Toggle */}
          <button
            type="button"
            onClick={handleToggleMute}
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer",
              isMuted
                ? "text-bourbon-400 hover:bg-espresso-800"
                : "text-crema-400 hover:text-crema-100 hover:bg-espresso-800"
            )}
            title={isMuted ? t("sound_unmute_all") : t("sound_mute_all")}
            aria-label={isMuted ? t("sound_unmute_all") : t("sound_mute_all")}
          >
            <AppIcon name={isMuted ? "volumeMute" : "volumeUp"} size={15} />
          </button>

          {/* Master Play/Pause Button */}
          <button
            type="button"
            onClick={handleMasterTogglePlay}
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm hover-spring",
              isPlaying
                ? "bg-brass-500 text-espresso-950 font-bold"
                : "bg-espresso-800 text-crema-200 hover:text-crema-50 hover:bg-espresso-750 border border-espresso-700"
            )}
            title={isPlaying ? "Pause audio" : "Play audio"}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
          >
            <AppIcon name={isPlaying ? "pause" : "play"} size={14} />
          </button>

          {/* Close button if provided */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-6 h-6 ml-0.5 rounded-full flex items-center justify-center text-crema-600 hover:text-crema-200 hover:bg-espresso-800 transition-colors cursor-pointer"
              title="Close audio card"
              aria-label="Close audio card"
            >
              <AppIcon name="close" size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ─── 4 Curated Audio Presets (Strictly 1 track at a time) ─── */}
      <div className="grid grid-cols-2 gap-1.5">
        {AUDIO_PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id && isPlaying && !isMuted;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className={cn(
                "flex items-center gap-2 p-2 rounded-xl text-left transition-all cursor-pointer hover-spring",
                isActive
                  ? "bg-brass-500/20 text-brass-300 border border-brass-500/60 shadow-sm"
                  : "bg-espresso-800/70 text-crema-300 border border-espresso-700/60 hover:text-crema-100 hover:bg-espresso-800"
              )}
              title={preset.desc}
            >
              <AppIcon
                name={preset.icon}
                size={16}
                className={isActive ? "text-brass-400 shrink-0" : "text-crema-500 shrink-0"}
              />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold truncate leading-tight">
                  {preset.name}
                </div>
                <div className="text-[9px] font-mono text-crema-500 truncate">
                  {preset.type === "youtube" ? "24/7 Stream" : "Ambient Loop"}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Prominent YouTube Stream Controls & Quick Streams ─── */}
      <div className="p-2 rounded-xl bg-espresso-950/70 border border-espresso-750/70 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-bourbon-400">
            <AppIcon name="youtube" size={14} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-crema-200">
              {t("sound_youtube_title")}
            </span>
          </div>
          {soundscape.getYoutubeVideoId() && (
            <span className="text-[9px] font-mono font-bold text-bourbon-400 bg-bourbon-500/15 border border-bourbon-500/30 px-1 rounded flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-bourbon-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>

        {/* Active YouTube Status Bar */}
        {customUrl ? (
          <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-bourbon-950/40 border border-bourbon-500/40 text-[10px]">
            <div className="flex items-center gap-1.5 min-w-0 pr-1">
              <AppIcon name="youtube" size={12} className="text-bourbon-400 shrink-0" />
              <span className="font-mono text-bourbon-200 truncate" title={customUrl}>
                {customUrl.replace(/^https?:\/\/(www\.)?/, "")}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearCustomUrl}
              className="text-bourbon-400 hover:text-bourbon-200 font-bold px-1 rounded shrink-0 cursor-pointer"
              title="Stop audio"
            >
              ✕ {t("sound_youtube_stop")}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePlayCustomUrl();
              }}
              placeholder={t("sound_custom_placeholder")}
              className="flex-1 px-2 py-1 text-[10px] text-crema-100 placeholder:text-crema-600 bg-espresso-900 rounded border border-espresso-700/80 focus:border-bourbon-500/60 focus:outline-none font-mono"
            />
            <button
              type="button"
              onClick={handlePlayCustomUrl}
              className="px-2.5 py-1 rounded bg-bourbon-500 text-espresso-950 text-[10px] font-bold hover:bg-bourbon-400 transition-colors shrink-0 cursor-pointer"
            >
              {t("sound_youtube_play")}
            </button>
          </div>
        )}

        {/* Quick Stream Buttons */}
        <div className="grid grid-cols-2 gap-1 pt-0.5">
          <button
            type="button"
            onClick={() => soundscape.setCustomAudio("https://www.youtube.com/watch?v=jfKfPfyJRdk")}
            className="px-1.5 py-1 rounded bg-espresso-850/80 hover:bg-espresso-800 text-[9px] font-mono text-crema-400 hover:text-crema-100 border border-espresso-750 text-left truncate flex items-center gap-1 cursor-pointer"
            title="Lofi Girl 24/7 Study"
          >
            <span className="w-1 h-1 rounded-full bg-bourbon-400 shrink-0" />
            <span className="truncate">Lofi Girl 24/7</span>
          </button>
          <button
            type="button"
            onClick={() => soundscape.setCustomAudio("https://www.youtube.com/watch?v=5qap5aO4i9A")}
            className="px-1.5 py-1 rounded bg-espresso-850/80 hover:bg-espresso-800 text-[9px] font-mono text-crema-400 hover:text-crema-100 border border-espresso-750 text-left truncate flex items-center gap-1 cursor-pointer"
            title="Rain on Window"
          >
            <span className="w-1 h-1 rounded-full bg-patina-400 shrink-0" />
            <span className="truncate">Rain on Window</span>
          </button>
        </div>
      </div>

      {/* ─── Bottom: Master Volume Slider + Percentage ─── */}
      <div className="flex items-center gap-3 pt-1 border-t border-espresso-800/80">
        <input
          type="range"
          min="0"
          max="100"
          value={masterVol}
          onChange={(e) => handleSliderChange(Number(e.target.value))}
          className="flex-1 h-1.5 bg-espresso-750 rounded-lg appearance-none cursor-pointer accent-brass-400"
          aria-label="Master Volume"
        />
        <span className="text-xs font-mono tabular-nums text-crema-400 min-w-[32px] text-right">
          {masterVol}%
        </span>
      </div>

      {/* Optional link to open detailed multi-track fader mixer */}
      {onOpenFullMixer && (
        <button
          type="button"
          onClick={onOpenFullMixer}
          className="text-[11px] text-crema-500 hover:text-brass-400 transition-colors text-center cursor-pointer mt-0.5"
        >
          {isVi ? "Bảng fader chi tiết →" : "Detailed soundboard & faders →"}
        </button>
      )}
    </div>
  );
}
