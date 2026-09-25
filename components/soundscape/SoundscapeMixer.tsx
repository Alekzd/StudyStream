"use client";

import { useState, useEffect } from "react";
import { soundscape, SOUND_TRACKS, AUDIO_PRESETS, YOUTUBE_QUICK_LINKS } from "@/lib/soundscape";
import { AppIcon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { useLanguage, type TranslationKey } from "@/context/LanguageContext";
import { MotionButton } from "@/components/ui/motion";

interface SoundscapeMixerProps {
  onClose?: () => void;
}

export function SoundscapeMixer({ onClose }: SoundscapeMixerProps) {
  const { t } = useLanguage();
  const [volumes, setVolumes] = useState<Record<string, number>>({});
  const [isMuted, setIsMuted] = useState(false);
  const [customUrl, setCustomUrl] = useState<string | null>(null);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [customInput, setCustomInput] = useState("");
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const v: Record<string, number> = {};
      SOUND_TRACKS.forEach((t) => {
        v[t.id] = soundscape.getVolume(t.id);
      });
      setVolumes(v);
      setIsMuted(soundscape.getIsMuted());
      setCustomUrl(soundscape.getCustomUrl());
      setYoutubeVideoId(soundscape.getYoutubeVideoId());
      setActivePresetId(soundscape.getActivePresetId());
    };

    update();
    const unsub = soundscape.subscribe(update);
    return unsub;
  }, []);

  const handleVolumeChange = (id: string, val: number) => {
    soundscape.setVolume(id, val);
    setVolumes((prev) => ({ ...prev, [id]: val }));
  };

  const handlePlayCustom = (urlToPlay?: string) => {
    const target = (urlToPlay ?? customInput).trim();
    if (!target) return;
    soundscape.setCustomAudio(target);
    setCustomInput("");
  };

  const activeYtLink = YOUTUBE_QUICK_LINKS.find((q) => q.id === youtubeVideoId);

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
          <MotionButton
            variant={isMuted ? "bourbon" : "ghost"}
            size="icon"
            onClick={() => soundscape.toggleMuteAll()}
            title={isMuted ? t("sound_unmute_all") : t("sound_mute_all")}
            className="w-8 h-8 rounded-lg"
          >
            <AppIcon name={isMuted ? "volumeMute" : "volumeUp"} size={16} />
          </MotionButton>
          {onClose && (
            <MotionButton
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-crema-600 hover:text-crema-100"
            >
              <AppIcon name="close" size={16} />
            </MotionButton>
          )}
        </div>
      </div>

      {/* ─── Prominent YouTube Stream Feature Section ─── */}
      <div className="px-4 py-3 border-b border-espresso-700/70 bg-espresso-950/60 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-bourbon-400">
            <AppIcon name="youtube" size={15} />
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-crema-100">
              {t("sound_youtube_title")}
            </span>
          </div>
          {youtubeVideoId && (
            <span className="text-[10px] font-mono font-bold text-bourbon-400 bg-bourbon-500/15 border border-bourbon-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-bourbon-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>

        {/* Active YouTube Playing Status Card */}
        {youtubeVideoId ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-bourbon-950/40 border border-bourbon-500/40 text-[11px]">
            <div className="flex items-center gap-2 min-w-0 pr-1">
              <AppIcon name="youtube" size={16} className="text-bourbon-400 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-crema-100 truncate text-[11px]">
                  {activeYtLink?.title || "YouTube Audio Stream"}
                </p>
                <p className="text-[9px] font-mono text-bourbon-300 truncate">
                  ID: {youtubeVideoId}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => soundscape.setCustomAudio(null)}
              className="px-2 py-1 rounded bg-bourbon-500/20 hover:bg-bourbon-500/30 text-bourbon-200 text-[10px] font-mono font-bold transition-colors cursor-pointer shrink-0"
              title="Stop YouTube audio"
            >
              ✕ {t("sound_youtube_stop")}
            </button>
          </div>
        ) : customUrl ? (
          <div className="flex items-center justify-between p-2 rounded-xl bg-espresso-850 border border-brass-500/40 text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0 pr-1">
              <AppIcon name="link" size={13} className="text-brass-400 shrink-0" />
              <span className="font-mono text-crema-200 truncate text-[10px]">
                {customUrl.replace(/^https?:\/\/(www\.)?/, "")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => soundscape.setCustomAudio(null)}
              className="text-bourbon-400 hover:text-bourbon-300 font-bold px-1.5"
              title="Stop custom audio"
            >
              ✕
            </button>
          </div>
        ) : null}

        {/* Input Bar: Paste YouTube URL / ID */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePlayCustom();
              }}
              placeholder={t("sound_custom_placeholder")}
              className="w-full pl-2 pr-2 py-1.5 text-[11px] text-crema-100 placeholder:text-crema-600 bg-espresso-900 rounded-lg border border-espresso-700/80 focus:border-bourbon-500/60 focus:outline-none font-mono"
            />
          </div>
          <button
            type="button"
            onClick={() => handlePlayCustom()}
            className="px-3 py-1.5 rounded-lg bg-bourbon-500 hover:bg-bourbon-400 text-espresso-950 text-[11px] font-bold transition-all shadow-sm cursor-pointer shrink-0"
          >
            {t("sound_youtube_play")}
          </button>
        </div>

        {/* Quick YouTube 24/7 Study Streams */}
        <div>
          <p className="text-[9px] font-mono text-crema-500 mb-1 flex items-center gap-1">
            <span>{t("sound_youtube_quick")}:</span>
          </p>
          <div className="grid grid-cols-2 gap-1">
            {YOUTUBE_QUICK_LINKS.map((item) => {
              const isCurrent = youtubeVideoId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handlePlayCustom(item.url)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[10px] text-left truncate transition-colors cursor-pointer border flex items-center gap-1",
                    isCurrent
                      ? "bg-bourbon-500/20 text-bourbon-300 border-bourbon-500/50 font-semibold"
                      : "bg-espresso-900/80 text-crema-400 hover:text-crema-100 hover:bg-espresso-850 border-espresso-800"
                  )}
                  title={item.title}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-bourbon-400 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── 4 Curated Ambient Presets (Mutually Exclusive) ─── */}
      <div className="px-4 py-3 border-b border-espresso-700/60 bg-espresso-850/40">
        <p className="text-[10px] font-mono font-bold text-brass-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <AppIcon name="sparkles" size={12} /> {t("sound_presets")}
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {AUDIO_PRESETS.map((p) => {
            const isActive = activePresetId === p.id && !isMuted;
            return (
              <MotionButton
                key={p.id}
                variant={isActive ? "brass" : "surface"}
                size="sm"
                onClick={() => soundscape.applyPreset(p.id)}
                className="w-full justify-start text-[11px] font-medium truncate gap-1.5 cursor-pointer"
                title={p.desc}
              >
                <AppIcon name={p.icon} size={13} className="shrink-0" />
                <span className="truncate">{p.name}</span>
              </MotionButton>
            );
          })}
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
