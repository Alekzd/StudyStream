"use client";
// components/soundscape/SoundscapeMixer.tsx
// StudyStream OS — Ambient Soundscape Mixer UI Drawer

import { useState, useEffect } from "react";
import { soundscape, SOUND_TRACKS, SoundTrack } from "@/lib/soundscape";
import { Volume2, VolumeX, X, Sliders, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SoundscapeMixerProps {
  onClose?: () => void;
}

export function SoundscapeMixer({ onClose }: SoundscapeMixerProps) {
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const update = () => {
      const v: Record<string, number> = {};
      SOUND_TRACKS.forEach((t) => {
        v[t.id] = soundscape.getVolume(t.id);
      });
      setVolumes(v);
      setIsMuted(soundscape.getIsMuted());
    };

    update();
    const unsub = soundscape.subscribe(update);
    return unsub;
  }, []);

  const handleVolumeChange = (id: string, val: number) => {
    soundscape.setVolume(id, val);
    setVolumes((prev) => ({ ...prev, [id]: val }));
  };

  const applyPreset = (preset: { name: string; settings: Record<string, number> }) => {
    // Stop all first
    SOUND_TRACKS.forEach((t) => {
      soundscape.setVolume(t.id, 0);
    });
    // Apply preset
    Object.entries(preset.settings).forEach(([id, vol]) => {
      soundscape.setVolume(id, vol);
    });
  };

  const presets: { name: string; settings: Record<string, number> }[] = [
    {
      name: "🌧️ Đêm Mưa Sâu Lắng",
      settings: { rain: 0.6, lofi: 0.3 },
    },
    {
      name: "☕ Góc Quán Cafe",
      settings: { cafe: 0.5, fireplace: 0.2 },
    },
    {
      name: "🌊 Biển Đêm Tĩnh Lặng",
      settings: { ocean: 0.5, fan: 0.2 },
    },
  ];

  return (
    <div className="w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full z-20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-indigo-400" />
          <h3 className="font-semibold text-neutral-200 text-sm">Bộ Hòa Âm Không Gian</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => soundscape.toggleMuteAll()}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              isMuted
                ? "text-red-400 bg-red-950/40"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
            )}
            title={isMuted ? "Bật âm thanh" : "Tắt toàn bộ"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Quick Presets */}
      <div className="px-4 py-3 border-b border-neutral-800/60 bg-neutral-950/40">
        <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Sparkles size={12} className="text-amber-400" /> Gợi Ý Hòa Âm Nhanh
        </p>
        <div className="flex flex-col gap-1.5">
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              className="text-left text-xs px-2.5 py-1.5 rounded-md bg-neutral-800/80 hover:bg-indigo-950/40 hover:text-indigo-300 text-neutral-300 border border-neutral-700/50 transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Track Volume Sliders */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {SOUND_TRACKS.map((track) => {
          const currentVol = Math.round((volumes[track.id] ?? 0) * 100);
          const isPlaying = currentVol > 0 && !isMuted;

          return (
            <div
              key={track.id}
              className={cn(
                "p-3 rounded-xl border transition-all",
                isPlaying
                  ? "bg-indigo-950/20 border-indigo-500/40"
                  : "bg-neutral-800/40 border-neutral-800"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{track.icon}</span>
                  <span className="text-xs font-medium text-neutral-200 truncate">
                    {track.name}
                  </span>
                </div>
                <span className="text-xs font-mono text-neutral-500">
                  {currentVol}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={currentVol}
                onChange={(e) =>
                  handleVolumeChange(track.id, Number(e.target.value) / 100)
                }
                className="w-full accent-indigo-500 h-1.5 bg-neutral-700 rounded-lg cursor-pointer"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
