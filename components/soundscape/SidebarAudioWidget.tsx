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
      let highestVolTrack = "espresso";
      let highestVol = 0;

      SOUND_TRACKS.forEach((track) => {
        const vol = soundscape.getVolume(track.id);
        if (vol > 0) {
          if (vol > highestVol) {
            highestVol = vol;
            highestVolTrack = track.id;
          }
        }
      });

      const customActive = Boolean(soundscape.getCustomUrl());
      const presetId = soundscape.getActivePresetId();

      setIsPlaying(soundscape.isPlayingAny());
      setIsMuted(soundscape.getIsMuted());

      if (customActive) {
        setActiveTrackId("custom");
        setVolume(soundscape.getMasterVolume());
      } else if (presetId) {
        setActiveTrackId(presetId);
        setVolume(soundscape.getMasterVolume());
      } else if (highestVol > 0) {
        setActiveTrackId(highestVolTrack);
        setVolume(Math.round(highestVol * 100));
      }
    };

    syncState();
    const unsubscribe = soundscape.subscribe(syncState);
    return unsubscribe;
  }, []);

  const togglePlay = () => {
    soundscape.togglePlayPauseAll();
  };

  const [showYtInput, setShowYtInput] = useState(false);
  const [ytInputVal, setYtInputVal] = useState("");
  const youtubeVideoId = soundscape.getYoutubeVideoId();

  const selectMood = (trackId: string) => {
    setActiveTrackId(trackId);
    soundscape.playSingleTrack(trackId, volume > 0 ? volume / 100 : 0.35);
  };

  const handlePlayYouTube = () => {
    if (!ytInputVal.trim()) return;
    soundscape.setCustomAudio(ytInputVal.trim());
    setYtInputVal("");
    setShowYtInput(false);
  };

  const handleStopYouTube = () => {
    soundscape.setCustomAudio(null);
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    soundscape.setMasterVolume(newVol);
  };

  const toggleMute = () => {
    soundscape.toggleMuteAll();
    setIsMuted(!isMuted);
  };

  const activeMoodName =
    youtubeVideoId
      ? "YouTube Audio"
      : activeTrackId === "custom"
      ? "Custom Audio"
      : QUICK_MOODS.find((m) => m.id === activeTrackId)?.label || "Ambience";

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
            <AppIcon name={youtubeVideoId ? "videoOn" : "headphones"} size={12} />
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
            onClick={() => setShowYtInput((v) => !v)}
            className={cn(
              "p-1 rounded text-xs transition-colors cursor-pointer",
              showYtInput || youtubeVideoId
                ? "text-bourbon-400 bg-espresso-800"
                : "text-crema-600 hover:text-crema-200"
            )}
            title="YouTube Stream"
            aria-label="YouTube Stream"
          >
            <AppIcon name="youtube" size={13} />
          </button>
          <button
            onClick={toggleMute}
            className="p-1 text-crema-600 hover:text-crema-200 rounded transition-colors cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
            aria-label="Toggle mute"
          >
            <AppIcon name={isMuted ? "volumeMute" : "volumeUp"} size={13} />
          </button>
          <button
            onClick={togglePlay}
            className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center transition-colors text-xs font-bold shrink-0 cursor-pointer",
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

      {/* YouTube Link Input Bar */}
      {showYtInput && (
        <div className="flex flex-col gap-1 p-1 bg-espresso-900 rounded-lg border border-espresso-700/80 animate-pop-in">
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={ytInputVal}
              onChange={(e) => setYtInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePlayYouTube();
                if (e.key === "Escape") setShowYtInput(false);
              }}
              placeholder="Paste YouTube link / ID..."
              className="flex-1 px-1.5 py-0.5 text-[10px] text-crema-100 placeholder:text-crema-600 bg-transparent focus:outline-none font-mono"
              autoFocus
            />
            <button
              type="button"
              onClick={handlePlayYouTube}
              className="px-2 py-0.5 rounded bg-bourbon-500 text-espresso-950 text-[10px] font-bold hover:bg-bourbon-400 transition-colors shrink-0 cursor-pointer"
            >
              Play
            </button>
          </div>
          <div className="flex items-center gap-1 text-[9px] font-mono text-crema-500 pt-0.5 border-t border-espresso-800">
            <span className="shrink-0 text-bourbon-400">24/7:</span>
            <button
              type="button"
              onClick={() => {
                soundscape.setCustomAudio("https://www.youtube.com/watch?v=jfKfPfyJRdk");
                setShowYtInput(false);
              }}
              className="px-1 py-0.5 rounded bg-espresso-800 hover:bg-espresso-750 text-crema-300 truncate cursor-pointer"
            >
              Lofi Girl
            </button>
            <button
              type="button"
              onClick={() => {
                soundscape.setCustomAudio("https://www.youtube.com/watch?v=5qap5aO4i9A");
                setShowYtInput(false);
              }}
              className="px-1 py-0.5 rounded bg-espresso-800 hover:bg-espresso-750 text-crema-300 truncate cursor-pointer"
            >
              Rain Lofi
            </button>
          </div>
        </div>
      )}

      {/* Active YouTube Stream Pill */}
      {youtubeVideoId && !showYtInput && (
        <div className="flex items-center justify-between px-2 py-1 bg-bourbon-950/40 border border-bourbon-500/40 rounded-lg text-[10px] font-mono text-bourbon-300">
          <span className="truncate pr-1">🔴 YouTube: {youtubeVideoId}</span>
          <button
            type="button"
            onClick={handleStopYouTube}
            className="text-bourbon-400 hover:text-bourbon-200 font-bold px-1"
            title="Dừng phát YouTube"
          >
            ✕
          </button>
        </div>
      )}

      {/* Quick Mood Selector Pills (Mutually Exclusive) */}
      <div className="grid grid-cols-4 gap-1">
        {QUICK_MOODS.map((mood) => {
          const isSelected = activeTrackId === mood.id && isPlaying && !youtubeVideoId;
          return (
            <button
              key={mood.id}
              onClick={() => selectMood(mood.id)}
              className={cn(
                "flex flex-col items-center justify-center py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer",
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
