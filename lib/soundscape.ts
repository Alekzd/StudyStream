// lib/soundscape.ts
// StudyStream OS — Ambient Soundscape Engine (Howler.js)
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

class SoundscapeManager {
  private howls: Map<string, Howl> = new Map();
  private volumes: Map<string, number> = new Map();
  private isMuted: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      this.loadStoredVolumes();
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

  public toggleMuteAll(): boolean {
    this.isMuted = !this.isMuted;
    this.howls.forEach((howl, id) => {
      const vol = this.volumes.get(id) ?? 0;
      howl.volume(this.isMuted ? 0 : vol);
    });
    this.notifyListeners();
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public stopAll() {
    this.howls.forEach((howl) => howl.stop());
    this.volumes.clear();
    this.saveStoredVolumes();
    this.notifyListeners();
  }

  public isPlayingAny(): boolean {
    if (this.isMuted) return false;
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
    const activeTracks = Array.from(this.volumes.entries()).filter(([, v]) => v > 0);
    if (activeTracks.length === 0) {
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
