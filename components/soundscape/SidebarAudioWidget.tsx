"use client";

import { useState, useEffect } from "react";
import { soundscape, SOUND_TRACKS } from "@/lib/soundscape";
import { AppIcon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const QUICK_MOODS = [
  { id: "espresso", label: "Espresso", icon: "coffee" },
  { id: "rain", label: "Rain", icon: "rain" },
  { id: "jazz", label: "Jazz", icon: "jazz" },
  { id: "fireplace", label: "Fire", icon: "fire" },
] as const;

interface SidebarAudioWidgetProps {
  compact?: boolean;
}

export function SidebarAudioWidget({ compact = false }: SidebarAudioWidgetProps) {
  const [activeTrackId, setActiveTrackId] = useState<string>("espresso");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(35);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    const syncState = () => {
      let anyPlaying = false;
      let highestVolTrack = "espresso";
      let highestVol = 0;

      SOUND_TRACKS.forEach((track) => {
        const vol = soundscape.getVolume(track.id);
        if (vol > 0) {
          anyPlaying = true;
          if (vol > highestVol) {
            highestVol = vol;
            highestVolTrack = track.id;
          }
        }
      });

      setIsPlaying(anyPlaying && !soundscape.getIsMuted());
      setIsMuted(soundscape.getIsMuted());
      if (highestVol > 0) {
        setActiveTrackId(highestVolTrack);
        setVolume(Math.round(highestVol * 100));
      }
    };

    syncState();
    const unsubscribe = soundscape.subscribe(syncState);
    return unsubscribe;
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      // Turn off all tracks
      SOUND_TRACKS.forEach((t) => soundscape.setVolume(t.id, 0));
      setIsPlaying(false);
    } else {
      // Play selected active track at current volume
      SOUND_TRACKS.forEach((t) => soundscape.setVolume(t.id, 0));
      const targetVol = volume > 0 ? volume / 100 : 0.35;
      soundscape.setVolume(activeTrackId, targetVol);
      if (isMuted) soundscape.toggleMuteAll();
      setIsPlaying(true);
    }
  };

  const selectMood = (trackId: string) => {
    setActiveTrackId(trackId);
    SOUND_TRACKS.forEach((t) => soundscape.setVolume(t.id, 0));
    const targetVol = volume > 0 ? volume / 100 : 0.35;
    soundscape.setVolume(trackId, targetVol);
    if (isMuted) soundscape.toggleMuteAll();
    setIsPlaying(true);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (isPlaying) {
      soundscape.setVolume(activeTrackId, newVol / 100);
    }
  };

  const toggleMute = () => {
    soundscape.toggleMuteAll();
    setIsMuted(!isMuted);
  };

  const activeMoodName =
    QUICK_MOODS.find((m) => m.id === activeTrackId)?.label || "Ambience";

  if (compact) {
    return (
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={togglePlay}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative",
            isPlaying
              ? "bg-brass-500 text-espresso-950 shadow-md font-bold"
              : "bg-espresso-850 text-crema-400 hover:text-crema-100 hover:bg-espresso-800 border border-espresso-700/80"
          )}
          title={isPlaying ? `Audio: ${activeMoodName} (Pause)` : "Play Ambient Audio"}
          aria-label="Toggle ambient audio"
        >
          <AppIcon name={isPlaying ? "headphones" : "coffee"} size={18} />
          {isPlaying && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-brass-400 animate-pulse ring-2 ring-espresso-950" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-espresso-850/80 border border-espresso-750/80 rounded-xl p-2.5 flex flex-col gap-2 select-none shadow-sm">
      {/* Top row: Status & Play/Pause */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-md bg-espresso-800 flex items-center justify-center text-brass-400 shrink-0">
            <AppIcon name="headphones" size={12} />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-medium text-crema-200 truncate">
              {isPlaying ? activeMoodName : "Ambient Audio"}
            </span>
            {isPlaying && (
              <span className="flex items-end gap-0.5 h-2.5 shrink-0 px-0.5">
                <span className="w-0.5 h-2 bg-brass-400 rounded-full animate-pulse" />
                <span className="w-0.5 h-3 bg-brass-400 rounded-full animate-pulse delay-75" />
                <span className="w-0.5 h-1.5 bg-brass-400 rounded-full animate-pulse delay-150" />
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleMute}
            className="p-1 text-crema-600 hover:text-crema-200 rounded transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
            aria-label="Toggle mute"
          >
            <AppIcon name={isMuted ? "volumeMute" : "volumeUp"} size={13} />
          </button>
          <button
            onClick={togglePlay}
            className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center transition-colors text-xs font-bold shrink-0",
              isPlaying
                ? "bg-brass-500 text-espresso-950 shadow-sm"
                : "bg-espresso-750 text-crema-300 hover:bg-espresso-700 hover:text-crema-100"
            )}
            title={isPlaying ? "Pause ambient sound" : "Play ambient sound"}
            aria-label={isPlaying ? "Pause ambient sound" : "Play ambient sound"}
          >
            {isPlaying ? (
              <AppIcon name="pause" size={10} />
            ) : (
              <AppIcon name="play" size={10} className="translate-x-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* Quick Mood Selector Pills */}
      <div className="grid grid-cols-4 gap-1">
        {QUICK_MOODS.map((mood) => {
          const isSelected = activeTrackId === mood.id && isPlaying;
          return (
            <button
              key={mood.id}
              onClick={() => selectMood(mood.id)}
              className={cn(
                "flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-mono transition-all",
                isSelected
                  ? "bg-brass-500/20 text-brass-300 border border-brass-500/40 font-semibold"
                  : "bg-espresso-900/60 text-crema-400 hover:bg-espresso-800 hover:text-crema-200 border border-espresso-800"
              )}
              title={mood.label}
            >
              <AppIcon name={mood.icon} size={12} className="mb-0.5" />
              <span className="truncate max-w-[48px]">{mood.label}</span>
            </button>
          );
        })}
      </div>

      {/* Mini Volume Slider */}
      <div className="flex items-center gap-2 px-0.5 pt-0.5">
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          className="w-full h-1 bg-espresso-750 rounded-lg appearance-none cursor-pointer accent-brass-500"
          title={`Volume: ${volume}%`}
          aria-label="Sound volume"
        />
        <span className="text-[10px] font-mono text-crema-600 w-6 text-right tabular-nums">
          {volume}%
        </span>
      </div>
    </div>
  );
}
