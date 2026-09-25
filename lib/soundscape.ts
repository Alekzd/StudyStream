// lib/soundscape.ts
// StudyStream — Ambient Soundscape Engine (Howler.js)
// Redesigned for: The Midnight Espresso Atelier (Espresso extraction, Vinyl Jazz, Tactile Keys)

import { Howl } from "howler";

export interface SoundTrack {
  id: string;
  nameKey: string;
  iconName: string;
  category: "coffee" | "jazz" | "ambient" | "nature";
  src: string | string[];
  defaultVolume: number;
}

export const SOUND_TRACKS: SoundTrack[] = [
  {
    id: "jazz",
    nameKey: "sound_jazz",
    iconName: "jazz",
    category: "jazz",
    src: [
      "/sounds/ambient/jazz.mp3",
      "https://raw.githubusercontent.com/YoyoZhang24/RelaX50/main/RelaX50/audios/ambient.mp3",
    ],
    defaultVolume: 0.35,
  },
  {
    id: "espresso",
    nameKey: "sound_espresso",
    iconName: "coffee",
    category: "coffee",
    src: [
      "/sounds/ambient/coffee.mp3",
      "https://raw.githubusercontent.com/gregoryjpark/ambient-factory/master/audio/talking.mp3",
      "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
    ],
    defaultVolume: 0.3,
  },
  {
    id: "rain",
    nameKey: "sound_rain",
    iconName: "rain",
    category: "nature",
    src: [
      "/sounds/ambient/rain.mp3",
      "https://raw.githubusercontent.com/gregoryjpark/ambient-factory/master/audio/rain.mp3",
    ],
    defaultVolume: 0.4,
  },
  {
    id: "fireplace",
    nameKey: "sound_fireplace",
    iconName: "fire",
    category: "ambient",
    src: [
      "/sounds/ambient/fire.mp3",
      "https://raw.githubusercontent.com/gregoryjpark/ambient-factory/master/audio/fire.mp3",
    ],
    defaultVolume: 0.25,
  },
  {
    id: "fan",
    nameKey: "sound_breeze",
    iconName: "wind",
    category: "ambient",
    src: [
      "/sounds/ambient/wind.mp3",
      "https://raw.githubusercontent.com/gregoryjpark/ambient-factory/master/audio/wind.mp3",
    ],
    defaultVolume: 0.2,
  },
];

export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  const regExp = /(?:youtu\.be\/|(?:www\.|music\.)?youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|live\/|shorts\/))([a-zA-Z0-9_-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1].length === 11) {
    return match[1];
  }
  if (/^[a-zA-Z0-9]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export interface AudioPreset {
  id: string;
  name: string;
  icon: string;
  type: "youtube" | "ambient";
  youtubeUrl?: string;
  ambientSettings?: Record<string, number>;
  desc: string;
}

export const AUDIO_PRESETS: AudioPreset[] = [
  {
    id: "lofi",
    name: "24/7 Lofi Stream",
    icon: "youtube",
    type: "youtube",
    youtubeUrl: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    desc: "Chilled beats for deep study",
  },
  {
    id: "espresso",
    name: "Espresso Cafe",
    icon: "coffee",
    type: "ambient",
    ambientSettings: { espresso: 0.45 },
    desc: "Warm coffee chatter & barista vibes",
  },
  {
    id: "rain",
    name: "Midnight Rain",
    icon: "rain",
    type: "ambient",
    ambientSettings: { rain: 0.45 },
    desc: "Heavy window rain & cozy atmosphere",
  },
  {
    id: "jazz",
    name: "Acoustic Jazz",
    icon: "jazz",
    type: "ambient",
    ambientSettings: { jazz: 0.45 },
    desc: "Relaxing piano & acoustic rhythm",
  },
];

export const YOUTUBE_QUICK_LINKS = [
  {
    title: "Lofi Girl 24/7 Study",
    url: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
    id: "jfKfPfyJRdk",
  },
  {
    title: "Rain on Window Lofi",
    url: "https://www.youtube.com/watch?v=5qap5aO4i9A",
    id: "5qap5aO4i9A",
  },
  {
    title: "Coffee Shop Jazz",
    url: "https://www.youtube.com/watch?v=Dx5qFachd3A",
    id: "Dx5qFachd3A",
  },
  {
    title: "Peaceful Ghibli Piano",
    url: "https://www.youtube.com/watch?v=0k5u1_XqF3U",
    id: "0k5u1_XqF3U",
  },
];

class SoundscapeManager {
  private howls: Map<string, Howl> = new Map();
  private volumes: Map<string, number> = new Map();
  private isMuted: boolean = false;
  private listeners: Set<() => void> = new Set();
  private customUrl: string | null = null;
  private youtubeVideoId: string | null = null;
  private customHowl: Howl | null = null;
  private activePresetId: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.loadStoredVolumes();
      this.loadStoredCustomAudio();
    }
  }

  private loadStoredVolumes() {
    try {
      const stored = localStorage.getItem("studystream_soundscape_volumes");
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.entries(parsed).forEach(([id, vol]) => {
          this.volumes.set(id, Number(vol));
        });
      }
    } catch {}
  }

  private loadStoredCustomAudio() {
    try {
      const saved = localStorage.getItem("studystream_custom_audio_url");
      if (saved) {
        this.customUrl = saved;
        this.youtubeVideoId = extractYouTubeId(saved);
      }
    } catch {}
  }

  private saveStoredVolumes() {
    if (typeof window === "undefined") return;
    try {
      const obj: Record<string, number> = {};
      this.volumes.forEach((vol, id) => {
        obj[id] = vol;
      });
      localStorage.setItem("studystream_soundscape_volumes", JSON.stringify(obj));
    } catch {}
  }

  public getVolume(id: string): number {
    if (this.volumes.has(id)) {
      return this.volumes.get(id)!;
    }
    return 0;
  }

  public setVolume(id: string, volume: number) {
    const clamped = Math.max(0, Math.min(1, volume));

    if (clamped > 0) {
      // Exclusivity: Stop any custom audio / YouTube when playing an ambient track
      if (this.customHowl) {
        this.customHowl.stop();
        this.customHowl = null;
      }
      this.youtubeVideoId = null;
      this.customUrl = null;
      this.activePresetId = id;
      try {
        localStorage.removeItem("studystream_custom_audio_url");
      } catch {}

      // Stop and zero all other ambient tracks
      this.howls.forEach((howl, otherId) => {
        if (otherId !== id) {
          howl.volume(0);
          howl.stop();
          this.volumes.set(otherId, 0);
        }
      });
    }

    this.volumes.set(id, clamped);
    this.saveStoredVolumes();

    let howl = this.howls.get(id);
    if (!howl && clamped > 0) {
      const track = SOUND_TRACKS.find((t) => t.id === id);
      if (track) {
        howl = new Howl({
          src: Array.isArray(track.src) ? track.src : [track.src],
          loop: true,
          html5: true,
          volume: this.isMuted ? 0 : clamped,
        });
        this.howls.set(id, howl);
      }
    }

    if (howl) {
      howl.volume(this.isMuted ? 0 : clamped);
      if (clamped > 0 && !howl.playing()) {
        howl.play();
      } else if (clamped === 0 && howl.playing()) {
        howl.pause();
      }
    }

    this.notifyListeners();
  }

  /**
   * Play exactly ONE single track exclusively, stopping all other sounds, custom audio, and YouTube.
   */
  public playSingleTrack(trackId: string, volume: number = 0.35) {
    // 1. Stop any custom/YouTube audio
    if (this.customHowl) {
      this.customHowl.stop();
      this.customHowl = null;
    }
    this.youtubeVideoId = null;
    this.customUrl = null;
    this.activePresetId = trackId;
    try {
      localStorage.removeItem("studystream_custom_audio_url");
    } catch {}

    // 2. Stop and clear all other tracks
    this.howls.forEach((howl, id) => {
      if (id !== trackId) {
        howl.volume(0);
        howl.stop();
        this.volumes.set(id, 0);
      }
    });

    // 3. Play selected track
    this.setVolume(trackId, volume);
    if (this.isMuted) {
      this.toggleMuteAll();
    }
    this.notifyListeners();
  }

  public setCustomAudio(url: string | null) {
    if (this.customHowl) {
      this.customHowl.stop();
      this.customHowl = null;
    }

    if (!url || !url.trim()) {
      this.customUrl = null;
      this.youtubeVideoId = null;
      this.activePresetId = null;
      try {
        localStorage.removeItem("studystream_custom_audio_url");
      } catch {}
      this.notifyListeners();
      return;
    }

    const trimmed = url.trim();
    this.customUrl = trimmed;
    try {
      localStorage.setItem("studystream_custom_audio_url", trimmed);
    } catch {}

    // Exclusivity: Mute and stop ALL ambient howls
    this.howls.forEach((h, id) => {
      h.volume(0);
      h.stop();
      this.volumes.set(id, 0);
    });
    this.saveStoredVolumes();

    const ytId = extractYouTubeId(trimmed);
    if (ytId) {
      this.youtubeVideoId = ytId;
      this.activePresetId = "youtube";
    } else {
      this.youtubeVideoId = null;
      this.activePresetId = "custom";
      this.customHowl = new Howl({
        src: [trimmed],
        loop: true,
        html5: true,
        volume: this.isMuted ? 0 : this.getMasterVolume() / 100,
      });
      if (!this.isMuted) {
        this.customHowl.play();
      }
    }

    this.notifyListeners();
  }

  public getCustomUrl(): string | null {
    return this.customUrl;
  }

  public getYoutubeVideoId(): string | null {
    return this.youtubeVideoId;
  }

  public getActivePresetId(): string | null {
    return this.activePresetId;
  }

  public applyPreset(presetId: string) {
    this.activePresetId = presetId;
    const preset = AUDIO_PRESETS.find((p) => p.id === presetId);

    // Stop all howls & custom audio first
    this.howls.forEach((howl, id) => {
      howl.volume(0);
      howl.stop();
      this.volumes.set(id, 0);
    });
    if (this.customHowl) {
      this.customHowl.stop();
      this.customHowl = null;
    }
    this.youtubeVideoId = null;
    this.customUrl = null;
    try {
      localStorage.removeItem("studystream_custom_audio_url");
    } catch {}

    if (preset?.type === "youtube" && preset.youtubeUrl) {
      this.setCustomAudio(preset.youtubeUrl);
      return;
    }

    if (preset?.type === "ambient" && preset.ambientSettings) {
      const firstEntry = Object.entries(preset.ambientSettings)[0];
      if (firstEntry) {
        this.setVolume(firstEntry[0], firstEntry[1]);
      }
    } else {
      // Single track fallback (e.g. espresso, rain, jazz, fireplace, fan)
      this.setVolume(presetId, 0.35);
    }

    if (this.isMuted) {
      this.toggleMuteAll();
    }
    this.notifyListeners();
  }

  public toggleMuteAll(): boolean {
    this.isMuted = !this.isMuted;
    this.howls.forEach((howl, id) => {
      const vol = this.volumes.get(id) ?? 0;
      howl.volume(this.isMuted ? 0 : vol);
    });
    if (this.customHowl) {
      this.customHowl.volume(this.isMuted ? 0 : this.getMasterVolume() / 100);
    }
    this.notifyListeners();
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public stopAll() {
    this.howls.forEach((howl) => howl.stop());
    this.volumes.clear();
    if (this.customHowl) {
      this.customHowl.stop();
      this.customHowl = null;
    }
    this.youtubeVideoId = null;
    this.customUrl = null;
    this.activePresetId = null;
    try {
      localStorage.removeItem("studystream_custom_audio_url");
    } catch {}
    this.saveStoredVolumes();
    this.notifyListeners();
  }

  public isPlayingAny(): boolean {
    if (this.isMuted) return false;
    if (this.youtubeVideoId) return true;
    if (this.customHowl && this.customHowl.playing()) return true;
    for (const vol of this.volumes.values()) {
      if (vol > 0) return true;
    }
    return false;
  }

  public getMasterVolume(): number {
    let sum = 0;
    let count = 0;
    for (const vol of this.volumes.values()) {
      if (vol > 0) {
        sum += vol;
        count++;
      }
    }
    return count > 0 ? Math.round((sum / count) * 100) : 35;
  }

  public setMasterVolume(pct: number) {
    const scale = Math.max(0, Math.min(1, pct / 100));
    if (this.customHowl) {
      this.customHowl.volume(this.isMuted ? 0 : scale);
    }

    const activeTracks = Array.from(this.volumes.entries()).filter(([, v]) => v > 0);
    if (activeTracks.length === 0 && !this.youtubeVideoId && !this.customHowl) {
      this.setVolume("espresso", scale);
    } else {
      activeTracks.forEach(([id]) => {
        this.setVolume(id, scale);
      });
    }
  }

  public togglePlayPauseAll(): boolean {
    if (this.isPlayingAny()) {
      this.toggleMuteAll();
      return false;
    } else {
      if (this.isMuted) {
        this.toggleMuteAll();
        return true;
      }
      if (this.customUrl) {
        this.setCustomAudio(this.customUrl);
        return true;
      }
      this.setVolume("espresso", 0.35);
      return true;
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((l) => l());
  }
}

export const soundscape = new SoundscapeManager();
