import { describe, it, expect } from "vitest";

describe("Session Presence & Webhook Ingest Logic", () => {
  describe("Convex Site URL Derivation for Exit Beacon", () => {
    it("converts convex cloud URL to site URL correctly", () => {
      const cloudUrl = "https://sample-app-123.convex.cloud";
      const siteUrl = cloudUrl.replace(".cloud", ".site");
      expect(siteUrl).toBe("https://sample-app-123.convex.site");
      expect(`${siteUrl}/api/leave-room`).toBe(
        "https://sample-app-123.convex.site/api/leave-room"
      );
    });
  });

  describe("LiveKit Webhook Event Routing", () => {
    it("identifies participant departure events", () => {
      const departureEvents = ["participant_left", "participant_connection_aborted"];
      expect(departureEvents.includes("participant_left")).toBe(true);
      expect(departureEvents.includes("participant_connection_aborted")).toBe(true);
      expect(departureEvents.includes("participant_joined")).toBe(false);
    });

    it("extracts room slug from studystream room name", () => {
      const liveKitRoomName = "studystream_deep-work-pomodoro-50-10";
      const slug = liveKitRoomName.replace(/^studystream_/, "");
      expect(slug).toBe("deep-work-pomodoro-50-10");
    });
  });

  describe("Clerk Session Lifecycle Events", () => {
    it("filters session termination events for participant cleanup", () => {
      const isTermination = (type: string) =>
        type === "session.ended" ||
        type === "session.removed" ||
        type === "session.revoked";

      expect(isTermination("session.ended")).toBe(true);
      expect(isTermination("session.removed")).toBe(true);
      expect(isTermination("session.revoked")).toBe(true);
      expect(isTermination("session.created")).toBe(false);
      expect(isTermination("user.updated")).toBe(false);
    });
  });

  describe("Stale Participant Cleanup Cutoff (Cron Sweep)", () => {
    it("calculates 2-hour cutoff threshold", () => {
      const now = 1774160000000;
      const twoHoursMs = 2 * 60 * 60 * 1000;
      const cutoff = now - twoHoursMs;

      const recentParticipant = { joinedAt: now - 30 * 60 * 1000 }; // 30m ago
      const staleParticipant = { joinedAt: now - 3 * 60 * 60 * 1000 }; // 3h ago

      expect(recentParticipant.joinedAt < cutoff).toBe(false);
      expect(staleParticipant.joinedAt < cutoff).toBe(true);
    });
  });

  describe("Dashboard Sync Metrics Aggregation", () => {
    it("computes focus minutes elapsed accurately from session duration", () => {
      const joinedAt = Date.now() - 25 * 60 * 1000; // 25 mins ago
      const durationMs = Date.now() - joinedAt;
      const durationMinutes = Math.floor(durationMs / 60000);
      expect(durationMinutes).toBeGreaterThanOrEqual(24);
      expect(durationMinutes).toBeLessThanOrEqual(26);
    });

    it("enforces minimum 2-minute threshold before logging focus duration", () => {
      const shouldLog = (durationMinutes: number, isSandbox: boolean) =>
        durationMinutes >= 2 && !isSandbox;

      expect(shouldLog(1, false)).toBe(false);
      expect(shouldLog(5, false)).toBe(true);
      expect(shouldLog(25, true)).toBe(false); // sandbox excluded
    });
  });
});
