"use client";

import React, { useState, useEffect } from "react";
import { soundscape } from "@/lib/soundscape";
import { AppIcon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

interface AmbientAudioDockProps {
  onClose?: () => void;
  onOpenFullMixer?: () => void;
  className?: string;
}

interface QuickTrack {
  id: string;
  label: string;
  icon: string;
  defaultVol: number;
}

const QUICK_TRACKS: QuickTrack[] = [
  { id: "espresso", label: "Espresso", icon: "coffee", defaultVol: 0.35 },
  { id: "rain", label: "Rain", icon: "rain", defaultVol: 0.4 },
  { id: "jazz", label: "Jazz", icon: "jazz", defaultVol: 0.35 },
  { id: "fireplace", label: "Fire", icon: "fire", defaultVol: 0.3 },
];

export function AmbientAudioDock({
  onClose,
  onOpenFullMixer,
  className,
}: AmbientAudioDockProps) {
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVol, setMasterVol] = useState(35);

  useEffect(() => {
    const syncState = () => {
      const v: Record<string, number> = {};
      QUICK_TRACKS.forEach((t) => {
        v[t.id] = soundscape.getVolume(t.id);
      });
      setVolumes(v);
      setIsMuted(soundscape.getIsMuted());
      setIsPlaying(soundscape.isPlayingAny());
      setMasterVol(soundscape.getMasterVolume());
    };

    syncState();
    const unsub = soundscape.subscribe(syncState);
    return unsub;
  }, []);

  const handleToggleTrack = (track: QuickTrack) => {
    const current = volumes[track.id] ?? 0;
    if (current > 0 && !isMuted) {
      soundscape.setVolume(track.id, 0);
    } else {
      if (isMuted) soundscape.toggleMuteAll();
      const targetVol = masterVol > 0 ? masterVol / 100 : track.defaultVol;
      soundscape.setVolume(track.id, targetVol);
    }
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

  return (
    <div
      className={cn(
        "select-none w-80 p-3.5 rounded-2xl bg-espresso-900/95 border border-espresso-700/80 shadow-2xl backdrop-blur-md",
        "animate-pip-in flex flex-col gap-3 transition-spring pointer-events-auto",
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
            Ambient Audio
          </span>
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
            title={isMuted ? "Unmute soundscape" : "Mute soundscape"}
            aria-label={isMuted ? "Unmute soundscape" : "Mute soundscape"}
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
            title={isPlaying ? "Pause ambient soundscape" : "Play ambient soundscape"}
            aria-label={isPlaying ? "Pause ambient soundscape" : "Play ambient soundscape"}
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

      {/* ─── Middle: Quick Track Chips (Espresso, Rain, Jazz, Fire) ─── */}
      <div className="grid grid-cols-4 gap-1.5">
        {QUICK_TRACKS.map((t) => {
          const vol = volumes[t.id] ?? 0;
          const active = vol > 0 && !isMuted;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => handleToggleTrack(t)}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all text-center cursor-pointer hover-spring",
                active
                  ? "bg-brass-500/20 text-brass-300 border border-brass-500/60 shadow-sm"
                  : "bg-espresso-800/70 text-crema-400 border border-espresso-700/60 hover:text-crema-200 hover:bg-espresso-800"
              )}
              title={`${t.label}: ${active ? `On (${Math.round(vol * 100)}%)` : "Off"}`}
            >
              <AppIcon
                name={t.icon}
                size={18}
                className={active ? "text-brass-400" : "text-crema-400"}
              />
              <span className="text-[11px] font-medium mt-1 tracking-tight">
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── Bottom: Master Volume Slider + Percentage ─── */}
      <div className="flex items-center gap-3 pt-0.5">
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
          Detailed soundboard & presets →
        </button>
      )}
    </div>
  );
}
