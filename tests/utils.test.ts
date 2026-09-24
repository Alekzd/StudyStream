import { describe, it, expect } from "vitest";
import {
  formatDuration,
  getArchetypeLabel,
  getArchetypeIcon,
  getArchetypeColor,
  cn,
  cleanTitle,
  getServerIcon,
} from "@/lib/utils";

describe("lib/utils", () => {
  describe("formatDuration", () => {
    it("formats 0 seconds as 00:00", () => {
      expect(formatDuration(0)).toBe("00:00");
    });

    it("formats 50 minutes (3000 seconds) as 50:00", () => {
      expect(formatDuration(3000)).toBe("50:00");
    });

    it("formats 10 minutes (600 seconds) as 10:00", () => {
      expect(formatDuration(600)).toBe("10:00");
    });

    it("formats negative seconds as 00:00", () => {
      expect(formatDuration(-10)).toBe("00:00");
    });

    it("pads single digit seconds and minutes", () => {
      expect(formatDuration(65)).toBe("01:05");
    });
  });

  describe("getArchetypeLabel", () => {
    it("returns correct Vietnamese labels without emojis", () => {
      expect(getArchetypeLabel("SILENT_FOCUS", "vi")).toBe("Im Lặng");
      expect(getArchetypeLabel("CAM_ACCOUNTABILITY", "vi")).toBe("Cam-On");
      expect(getArchetypeLabel("SYNC_POMODORO", "vi")).toBe("Pomodoro");
      expect(getArchetypeLabel("AMBIENT_LOFI", "vi")).toBe("Ambient");
      expect(getArchetypeLabel("PAIR_SCREENSHARE", "vi")).toBe("Pair Code");
      expect(getArchetypeLabel("SANDBOX_TEST", "vi")).toBe("Sandbox");
    });

    it("returns correct English labels without emojis", () => {
      expect(getArchetypeLabel("SILENT_FOCUS", "en")).toBe("Silent Focus");
      expect(getArchetypeLabel("CAM_ACCOUNTABILITY", "en")).toBe("Cam Accountability");
      expect(getArchetypeLabel("SYNC_POMODORO", "en")).toBe("Sync Pomodoro");
      expect(getArchetypeLabel("AMBIENT_LOFI", "en")).toBe("Ambient");
    });

    it("returns original value for unknown archetype", () => {
      expect(getArchetypeLabel("UNKNOWN_TYPE")).toBe("UNKNOWN_TYPE");
    });
  });

  describe("getArchetypeIcon", () => {
    it("returns semantic icon names for archetypes", () => {
      expect(getArchetypeIcon("SILENT_FOCUS")).toBe("micOff");
      expect(getArchetypeIcon("CAM_ACCOUNTABILITY")).toBe("videoOn");
      expect(getArchetypeIcon("SYNC_POMODORO")).toBe("clock");
      expect(getArchetypeIcon("AMBIENT_LOFI")).toBe("coffee");
      expect(getArchetypeIcon("PAIR_SCREENSHARE")).toBe("screenShare");
      expect(getArchetypeIcon("SANDBOX_TEST")).toBe("flask");
    });
  });

  describe("getArchetypeColor", () => {
    it("returns color classes for archetypes", () => {
      expect(getArchetypeColor("SILENT_FOCUS")).toBe("text-blue-400");
      expect(getArchetypeColor("CAM_ACCOUNTABILITY")).toBe("text-green-400");
      expect(getArchetypeColor("SYNC_POMODORO")).toBe("text-amber-400");
    });
  });

  describe("cleanTitle", () => {
    it("strips leading emojis and leaves legitimate title intact", () => {
      expect(cleanTitle("☕ 24/7 Silent Focus Sanctuary")).toBe("24/7 Silent Focus Sanctuary");
      expect(cleanTitle("🔥 Deep Work Pomodoro (50/10)")).toBe("Deep Work Pomodoro (50/10)");
      expect(cleanTitle("⚡ Classic Pomodoro Sprint (25/5)")).toBe("Classic Pomodoro Sprint (25/5)");
      expect(cleanTitle("🌧️ Midnight Lofi & Rain Cafe")).toBe("Midnight Lofi & Rain Cafe");
      expect(cleanTitle("💻 Group Study & Screenshare")).toBe("Group Study & Screenshare");
    });

    it("strips trailing emojis and regional flags", () => {
      expect(cleanTitle("Vietnam Campus 🇻🇳")).toBe("Vietnam Campus");
      expect(cleanTitle("Global Commons 🌐")).toBe("Global Commons");
      expect(cleanTitle("Tokyo Atelier 🇯🇵")).toBe("Tokyo Atelier");
      expect(cleanTitle("Americas Hub 🇺🇸")).toBe("Americas Hub");
      expect(cleanTitle("Europe Library 🇪🇺")).toBe("Europe Library");
      expect(cleanTitle("All Regions 🗺️")).toBe("All Regions");
    });

    it("returns clean strings unchanged", () => {
      expect(cleanTitle("Focus Room 101")).toBe("Focus Room 101");
      expect(cleanTitle("Workstation (Silent)")).toBe("Workstation (Silent)");
    });
  });

  describe("getServerIcon", () => {
    it("returns semantic icon names for regional servers", () => {
      expect(getServerIcon("vietnam")).toBe("compass");
      expect(getServerIcon("japan-korea")).toBe("sparkles");
      expect(getServerIcon("north-america")).toBe("laptop");
      expect(getServerIcon("europe")).toBe("library");
      expect(getServerIcon("global")).toBe("globe");
    });
  });

  describe("cn", () => {
    it("merges classes correctly", () => {
      expect(cn("px-2", "py-2")).toBe("px-2 py-2");
      expect(cn("px-2", "px-4")).toBe("px-4");
    });
  });
});
