// lib/soundscape.ts
// StudyStream OS — Ambient Soundscape Engine (Howler.js + Web Audio API synthesis)
// Reference: 04_CSW_Core_Features_and_BodyDoubling.md

import { Howl } from "howler";

export interface SoundTrack {
  id: string;
  name: string;
  icon: string;
  category: "nature" | "ambient" | "music";
  src: string;
  defaultVolume: number;
}

export const SOUND_TRACKS: SoundTrack[] = [
  {
    id: "rain",
    name: "Mưa Rào Ban Đêm",
    icon: "🌧️",
    category: "nature",
    src: "https://actions.google.com/sounds/v1/weather/rain_heavy.ogg",
    defaultVolume: 0.4,
  },
  {
    id: "cafe",
    name: "Quán Cà Phê Nhộn Nhịp",
    icon: "☕",
    category: "ambient",
    src: "https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg",
    defaultVolume: 0.25,
  },
  {
    id: "ocean",
    name: "Sóng Biển Vỗ Bờ",
    icon: "🌊",
    category: "nature",
    src: "https://actions.google.com/sounds/v1/water/waves_crashing_on_rocks_2.ogg",
    defaultVolume: 0.35,
  },
  {
    id: "fireplace",
    name: "Lò Sưởi Mùa Đông",
    icon: "🔥",
    category: "ambient",
    src: "https://actions.google.com/sounds/v1/household/fireplace_crackling.ogg",
    defaultVolume: 0.3,
  },
  {
    id: "fan",
    name: "Tiếng Quạt Gió (White Noise)",
    icon: "💨",
    category: "ambient",
    src: "https://actions.google.com/sounds/v1/household/electric_fan.ogg",
    defaultVolume: 0.2,
  },
  {
    id: "lofi",
    name: "Lofi Chillhop Beats",
    icon: "🎵",
    category: "music",
    src: "https://actions.google.com/sounds/v1/science_fiction/deep_hum.ogg",
    defaultVolume: 0.5,
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
    } catch {
      // Ignore storage errors
    }
  }

  private saveStoredVolumes() {
    if (typeof window === "undefined") return;
    try {
      const obj: Record<string, number> = {};
      this.volumes.forEach((vol, id) => {
        obj[id] = vol;
      });
      localStorage.setItem("studystream_soundscape_volumes", JSON.stringify(obj));
    } catch {
      // Ignore storage errors
    }
  }

  public getVolume(id: string): number {
    if (this.volumes.has(id)) {
      return this.volumes.get(id)!;
    }
    return 0; // Default off until user turns it up
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
          html5: true, // Saves browser memory and supports streaming
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
