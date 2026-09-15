"use client";

import { useState, useEffect } from "react";
import { soundscape, SOUND_TRACKS } from "@/lib/soundscape";
import { AppIcon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { useLanguage, TranslationKey } from "@/context/LanguageContext";

interface SoundscapeMixerProps {
  onClose?: () => void;
}

export function SoundscapeMixer({ onClose }: SoundscapeMixerProps) {
  const { t } = useLanguage();
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

  const applyPreset = (settings: Record<string, number>) => {
    SOUND_TRACKS.forEach((track) => {
      soundscape.setVolume(track.id, 0);
    });
    Object.entries(settings).forEach(([id, vol]) => {
      soundscape.setVolume(id, vol);
    });
  };

  const presets: { labelKey: TranslationKey; settings: Record<string, number> }[] = [
    {
      labelKey: "preset_espresso_bar",
      settings: { espresso: 0.5, jazz: 0.4 },
    },
    {
      labelKey: "preset_night_shift",
      settings: { espresso: 0.6, rain: 0.3 },
    },
    {
      labelKey: "preset_deep_rain",
      settings: { rain: 0.6, jazz: 0.5 },
    },
  ];

  return (
    <div className="w-full sm:w-80 bg-espresso-900 border-l border-espresso-700/80 flex flex-col h-full z-20 shadow-2xl select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-espresso-700/80 bg-espresso-900">
        <div className="flex items-center gap-2">
          <AppIcon name="sliders" size={18} className="text-brass-500" />
          <h3 className="font-semibold text-crema-100 text-sm">
            {t("soundscape_title")}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => soundscape.toggleMuteAll()}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              isMuted
                ? "text-bourbon-400 bg-bourbon-500/20"
                : "text-crema-400 hover:text-crema-100 hover:bg-espresso-800"
            )}
            title={isMuted ? t("sound_unmute_all") : t("sound_mute_all")}
          >
            <AppIcon name={isMuted ? "volumeMute" : "volumeUp"} size={16} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-crema-600 hover:text-crema-100 rounded-lg transition-colors"
            >
              <AppIcon name="close" size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Quick Presets */}
      <div className="px-4 py-3 border-b border-espresso-700/60 bg-espresso-850/50">
        <p className="text-[10px] font-mono font-bold text-brass-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <AppIcon name="sparkles" size={12} /> {t("sound_presets")}
        </p>
        <div className="flex flex-col gap-1.5">
          {presets.map((p) => (
            <button
              key={p.labelKey}
              onClick={() => applyPreset(p.settings)}
              className="text-left text-xs px-2.5 py-1.5 rounded-lg bg-espresso-800/80 hover:bg-espresso-750 text-crema-200 hover:text-brass-300 border border-espresso-700/60 transition-colors truncate"
            >
              {t(p.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Track Volume Sliders */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {SOUND_TRACKS.map((track) => {
          const currentVol = Math.round((volumes[track.id] ?? 0) * 100);
          const isPlaying = currentVol > 0 && !isMuted;

          return (
            <div
              key={track.id}
              className={cn(
                "p-3 rounded-xl border transition-all duration-200",
                isPlaying
                  ? "bg-espresso-800 border-brass-500/40 shadow-sm"
                  : "bg-espresso-850/40 border-espresso-700/60"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AppIcon
                    name={track.iconName}
                    size={16}
                    className={isPlaying ? "text-brass-400" : "text-crema-600"}
                  />
                  <span className="text-xs font-medium text-crema-200 truncate max-w-[170px]">
                    {t(track.nameKey as TranslationKey)}
                  </span>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-crema-600">
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
                className="w-full accent-brass-500 h-1.5 bg-espresso-700 rounded-lg cursor-pointer"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
