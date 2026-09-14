import { describe, it, expect } from "vitest";
import { formatDuration, getArchetypeLabel, getArchetypeColor, cn } from "@/lib/utils";

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
    it("returns correct labels for standard archetypes", () => {
      expect(getArchetypeLabel("SILENT_FOCUS")).toContain("Im Lặng");
      expect(getArchetypeLabel("CAM_ACCOUNTABILITY")).toContain("Cam-On");
      expect(getArchetypeLabel("SYNC_POMODORO")).toContain("Pomodoro");
      expect(getArchetypeLabel("AMBIENT_LOFI")).toContain("Ambient");
      expect(getArchetypeLabel("PAIR_SCREENSHARE")).toContain("Pair Code");
      expect(getArchetypeLabel("SANDBOX_TEST")).toContain("Sandbox");
    });

    it("returns original value for unknown archetype", () => {
      expect(getArchetypeLabel("UNKNOWN_TYPE")).toBe("UNKNOWN_TYPE");
    });
  });

  describe("getArchetypeColor", () => {
    it("returns color classes for archetypes", () => {
      expect(getArchetypeColor("SILENT_FOCUS")).toBe("text-blue-400");
      expect(getArchetypeColor("CAM_ACCOUNTABILITY")).toBe("text-green-400");
      expect(getArchetypeColor("SYNC_POMODORO")).toBe("text-amber-400");
    });
  });

  describe("cn", () => {
    it("merges classes correctly", () => {
      expect(cn("px-2", "py-2")).toBe("px-2 py-2");
      expect(cn("px-2", "px-4")).toBe("px-4");
    });
  });
});
