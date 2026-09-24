import { describe, it, expect } from "vitest";
import { ICON_MAP, getResolvedIconName, SemanticIconName } from "@/components/ui/Icon";
import { getArchetypeIcon, getServerIcon } from "@/lib/utils";
import { SOUND_TRACKS } from "@/lib/soundscape";
import phJson from "@iconify-json/ph/icons.json";
import solarJson from "@iconify-json/solar/icons.json";

describe("StudyStream OS — Unified Icon Registry", () => {
  const phIcons = phJson.icons as Record<string, unknown>;
  const solarIcons = solarJson.icons as Record<string, unknown>;

  it("has a rich registry of verified semantic icons and logos", () => {
    const iconKeys = Object.keys(ICON_MAP);
    expect(iconKeys.length).toBeGreaterThanOrEqual(100);
  });

  it("every icon in ICON_MAP exists in installed icon sets (@iconify-json/ph or @iconify-json/solar)", () => {
    const missing: string[] = [];

    for (const [key, iconString] of Object.entries(ICON_MAP)) {
      const [prefix, iconName] = iconString.split(":");
      if (prefix === "ph") {
        if (!phIcons[iconName]) {
          missing.push(`${key} -> ${iconString} (not found in ph)`);
        }
      } else if (prefix === "solar") {
        if (!solarIcons[iconName]) {
          missing.push(`${key} -> ${iconString} (not found in solar)`);
        }
      } else {
        missing.push(`${key} -> ${iconString} (unsupported prefix: ${prefix})`);
      }
    }

    expect(missing).toEqual([]);
  });

  it("contains all essential brand & community logos", () => {
    const essentialLogos: SemanticIconName[] = [
      "discord",
      "google",
      "github",
      "apple",
      "spotify",
      "youtube",
      "twitter",
      "x",
      "slack",
      "notion",
      "figma",
      "twitch",
      "openAi",
      "studystream",
      "livekit",
    ];

    essentialLogos.forEach((logo) => {
      expect(ICON_MAP).toHaveProperty(logo);
      expect(typeof ICON_MAP[logo]).toBe("string");
    });
  });

  it("all room discipline archetype icons exist in ICON_MAP", () => {
    const archetypes = [
      "SILENT_FOCUS",
      "CAM_ACCOUNTABILITY",
      "SYNC_POMODORO",
      "AMBIENT_LOFI",
      "PAIR_SCREENSHARE",
      "SANDBOX_TEST",
    ];

    archetypes.forEach((arch) => {
      const iconKey = getArchetypeIcon(arch);
      expect(ICON_MAP).toHaveProperty(iconKey);
    });
  });

  it("all ambient soundscape track icons exist in ICON_MAP", () => {
    SOUND_TRACKS.forEach((track) => {
      expect(ICON_MAP).toHaveProperty(track.iconName);
    });
  });

  it("all regional server icons exist in ICON_MAP", () => {
    const serverSlugs = ["vietnam", "japan-korea", "north-america", "europe", "global"];
    serverSlugs.forEach((slug) => {
      const iconKey = getServerIcon(slug);
      expect(ICON_MAP).toHaveProperty(iconKey);
    });
  });

  describe("getResolvedIconName fallback behavior", () => {
    it("resolves known semantic icon keys", () => {
      expect(getResolvedIconName("coffee")).toBe(ICON_MAP.coffee);
      expect(getResolvedIconName("discord")).toBe(ICON_MAP.discord);
      expect(getResolvedIconName("flame")).toBe(ICON_MAP.flame);
    });

    it("passes through raw icon strings with colons", () => {
      expect(getResolvedIconName("ph:user-bold")).toBe("ph:user-bold");
      expect(getResolvedIconName("solar:star-bold")).toBe("solar:star-bold");
    });

    it("gracefully falls back on unknown strings without throwing", () => {
      const fallback = getResolvedIconName("non_existent_symbol_123");
      expect(fallback).toBe("solar:cup-hot-bold");
    });
  });

  describe("codebase AppIcon usage validation", () => {
    it("every literal icon name used in <AppIcon name='...' /> exists in ICON_MAP", async () => {
      const fs = await import("fs");
      const path = await import("path");

      function getTsxFiles(dir: string): string[] {
        let results: string[] = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== ".git") {
              results = results.concat(getTsxFiles(fullPath));
            }
          } else if (entry.name.endsWith(".tsx")) {
            results.push(fullPath);
          }
        }
        return results;
      }

      const files = [...getTsxFiles("app"), ...getTsxFiles("components")];
      const literalIconNames = new Set<string>();

      for (const file of files) {
        const content = fs.readFileSync(file, "utf8");
        const regex = /<AppIcon[^>]*name="([^"]+)"/g;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(content)) !== null) {
          literalIconNames.add(match[1]);
        }
      }

      const unmapped: string[] = [];
      for (const name of literalIconNames) {
        if (!Object.prototype.hasOwnProperty.call(ICON_MAP, name)) {
          unmapped.push(name);
        }
      }

      expect(unmapped).toEqual([]);
    });
  });
});

