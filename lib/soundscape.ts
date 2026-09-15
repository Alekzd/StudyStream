// lib/soundscape.ts
// StudyStream OS — Ambient Soundscape Engine (Howler.js)
// Redesigned for: The Midnight Espresso Atelier (Espresso extraction, Vinyl Jazz, Tactile Keys)

import { Howl } from "howler";

export interface SoundTrack {
  id: string;
  nameKey: string;
  iconName: string;
  category: "coffee" | "jazz" | "ambient" | "nature";
  src: string;
  defaultVolume: number;
}

export const SOUND_TRACKS: SoundTrack[] = [
  {
    id: "jazz",
    nameKey: "sound_jazz",
    iconName: "jazz",
    category: "jazz",
    // Deep vinyl hum and vintage acoustic warmth
    src: "https://actions.google.com/sounds/v1/science_fiction/deep_hum.ogg",
    defaultVolume: 0.35,
  },
  {
    id: "espresso",
    nameKey: "sound_espresso",
    iconName: "coffee",
    category: "coffee",
    // Atmospheric espresso bar ambient sound
    src: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
    defaultVolume: 0.3,
  },
  {
    id: "rain",
    nameKey: "sound_rain",
    iconName: "soundwave",
    category: "nature",
    src: "https://actions.google.com/sounds/v1/weather/rain_heavy.ogg",
    defaultVolume: 0.4,
  },
  {
    id: "fireplace",
    nameKey: "sound_fireplace",
    iconName: "flame",
    category: "ambient",
    src: "https://actions.google.com/sounds/v1/household/fireplace_crackling.ogg",
    defaultVolume: 0.25,
  },
  {
    id: "fan",
    nameKey: "sound_breeze",
    iconName: "soundwave",
    category: "ambient",
    src: "https://actions.google.com/sounds/v1/household/electric_fan.ogg",
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
          src: [track.src],
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
