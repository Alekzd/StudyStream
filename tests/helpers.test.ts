import { describe, it, expect } from "vitest";
import {
  generateInviteCode,
  formatDateKey,
  calculateNewStreak,
  validateStringLength,
} from "@/convex/helpers";

describe("convex/helpers", () => {
  describe("generateInviteCode", () => {
    it("generates 6-character code", () => {
      const code = generateInviteCode();
      expect(code).toHaveLength(6);
    });

    it("generates uppercase alphanumeric codes", () => {
      const code = generateInviteCode();
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    });

    it("generates unique codes", () => {
      const code1 = generateInviteCode();
      const code2 = generateInviteCode();
      expect(code1).not.toBe(code2);
    });
  });

  describe("formatDateKey", () => {
    it("formats date as YYYY-MM-DD", () => {
      const date = new Date(2026, 8, 14); // Sep 14, 2026
      expect(formatDateKey(date)).toBe("2026-09-14");
    });

    it("pads single digit months and days", () => {
      const date = new Date(2026, 0, 5); // Jan 5, 2026
      expect(formatDateKey(date)).toBe("2026-01-05");
    });
  });

  describe("calculateNewStreak", () => {
    it("starts streak at 1 if no previous study date", () => {
      expect(calculateNewStreak(0, undefined, "2026-09-14")).toBe(1);
    });

    it("maintains streak if already studied today", () => {
      expect(calculateNewStreak(5, "2026-09-14", "2026-09-14")).toBe(5);
    });

    it("increments streak if studied yesterday", () => {
      expect(calculateNewStreak(5, "2026-09-13", "2026-09-14")).toBe(6);
    });

    it("resets streak to 1 if missed more than 1 day", () => {
      expect(calculateNewStreak(10, "2026-09-10", "2026-09-14")).toBe(1);
    });
  });

  describe("validateStringLength", () => {
    it("does not throw when string is within limit", () => {
      expect(() => validateStringLength("hello", 10, "test")).not.toThrow();
    });

    it("throws when string exceeds limit", () => {
      expect(() => validateStringLength("hello world", 5, "test")).toThrow(
        /vượt quá 5 ký tự/
      );
    });

    it("handles undefined gracefully", () => {
      expect(() => validateStringLength(undefined, 10, "test")).not.toThrow();
    });
  });
});
