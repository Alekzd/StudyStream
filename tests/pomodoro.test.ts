import { describe, it, expect } from "vitest";
import { formatDuration } from "@/lib/utils";

// Model of Convex server-authoritative autoTransitionPhase logic
interface PomodoroSessionState {
  _id: string;
  roomId: string;
  status: "IDLE" | "WORK" | "BREAK" | "PAUSED";
  durationSeconds: number;
  targetEndTime: number;
  cycleNumber: number;
  updatedAt: number;
}

function simulateAutoTransitionPhase(
  session: PomodoroSessionState,
  args: {
    expectedStatus: "WORK" | "BREAK";
    cadence?: string;
    now: number;
  }
): { session: PomodoroSessionState; action: "transitioned" | "ignored" | "reset_idle" } {
  // Idempotency check 1: Status must match expectedStatus
  if (session.status !== args.expectedStatus) {
    return { session, action: "ignored" };
  }

  // Idempotency check 2: targetEndTime must have elapsed
  if (session.targetEndTime > args.now) {
    return { session, action: "ignored" };
  }

  // Stale session check: > 3 hours abandoned
  if (args.now - session.targetEndTime > 3 * 60 * 60 * 1000) {
    return {
      session: {
        ...session,
        status: "IDLE",
        targetEndTime: 0,
        updatedAt: args.now,
      },
      action: "reset_idle",
    };
  }

  const nextPhase = session.status === "WORK" ? "BREAK" : "WORK";
  let workMin = 50;
  let breakMin = 10;
  if (args.cadence) {
    const [w, b] = args.cadence.split("/").map((v) => parseInt(v, 10));
    if (w) workMin = w;
    if (b) breakMin = b;
  }

  const durationMinutes = nextPhase === "WORK" ? workMin : breakMin;
  const durationSeconds = durationMinutes * 60;

  return {
    session: {
      ...session,
      status: nextPhase,
      durationSeconds,
      targetEndTime: args.now + durationSeconds * 1000,
      cycleNumber: nextPhase === "WORK" ? session.cycleNumber + 1 : session.cycleNumber,
      updatedAt: args.now,
    },
    action: "transitioned",
  };
}

describe("StudyStream — Pomodoro Cadence & Sync Logic", () => {
  describe("Cadence parser & defaults", () => {
    it("correctly parses standard 50/10 Deep Work cadence", () => {
      const cadence = "50/10";
      const [w, b] = cadence.split("/").map((v) => parseInt(v, 10));
      expect(w).toBe(50);
      expect(b).toBe(10);
      expect(formatDuration(w * 60)).toBe("50:00");
      expect(formatDuration(b * 60)).toBe("10:00");
    });

    it("correctly parses 25/5 Classic Pomodoro cadence", () => {
      const cadence = "25/5";
      const [w, b] = cadence.split("/").map((v) => parseInt(v, 10));
      expect(w).toBe(25);
      expect(b).toBe(5);
      expect(formatDuration(w * 60)).toBe("25:00");
      expect(formatDuration(b * 60)).toBe("05:00");
    });

    it("correctly parses 90/20 Ultradian Cycle cadence", () => {
      const cadence = "90/20";
      const [w, b] = cadence.split("/").map((v) => parseInt(v, 10));
      expect(w).toBe(90);
      expect(b).toBe(20);
      expect(formatDuration(w * 60)).toBe("90:00");
      expect(formatDuration(b * 60)).toBe("20:00");
    });

    it("handles fallback gracefully when cadence is malformed", () => {
      const cadence = "custom";
      const [w, b] = cadence.split("/").map((v) => parseInt(v, 10));
      const workDuration = w || 50;
      const breakDuration = b || 10;
      expect(workDuration).toBe(50);
      expect(breakDuration).toBe(10);
    });
  });

  describe("Remaining time & paused session resumption", () => {
    it("computes remaining seconds without drift from targetEndTime", () => {
      const now = 1700000000000;
      const targetEndTime = now + 1500 * 1000; // 25 minutes left
      const remaining = Math.max(0, Math.floor((targetEndTime - now) / 1000));
      expect(remaining).toBe(1500);
      expect(formatDuration(remaining)).toBe("25:00");
    });

    it("preserves exact remaining seconds on pause and resume", () => {
      const pausedRemainingSeconds = 742; // 12m 22s remaining
      const resumeNow = Date.now();
      const newTargetEndTime = resumeNow + pausedRemainingSeconds * 1000;
      const resumedRemaining = Math.max(0, Math.floor((newTargetEndTime - resumeNow) / 1000));
      expect(resumedRemaining).toBe(742);
      expect(formatDuration(resumedRemaining)).toBe("12:22");
    });
  });

  describe("Auto-Phase Transition & Distributed Idempotency", () => {
    const baseSession: PomodoroSessionState = {
      _id: "pomo_1",
      roomId: "room_1",
      status: "WORK",
      durationSeconds: 3000, // 50m
      targetEndTime: 1700000000000,
      cycleNumber: 1,
      updatedAt: 1700000000000 - 3000 * 1000,
    };

    it("automatically transitions from WORK to BREAK when targetEndTime has elapsed", () => {
      const now = baseSession.targetEndTime + 2500; // 2.5s after completion
      const result = simulateAutoTransitionPhase(baseSession, {
        expectedStatus: "WORK",
        cadence: "50/10",
        now,
      });

      expect(result.action).toBe("transitioned");
      expect(result.session.status).toBe("BREAK");
      expect(result.session.durationSeconds).toBe(10 * 60);
      expect(result.session.targetEndTime).toBe(now + 600 * 1000);
      expect(result.session.cycleNumber).toBe(1); // Cycle stays 1 during break
    });

    it("automatically transitions from BREAK back to WORK and increments cycleNumber", () => {
      const breakSession: PomodoroSessionState = {
        ...baseSession,
        status: "BREAK",
        durationSeconds: 600,
        targetEndTime: 1700000600000,
        cycleNumber: 1,
      };

      const now = breakSession.targetEndTime + 2500;
      const result = simulateAutoTransitionPhase(breakSession, {
        expectedStatus: "BREAK",
        cadence: "50/10",
        now,
      });

      expect(result.action).toBe("transitioned");
      expect(result.session.status).toBe("WORK");
      expect(result.session.durationSeconds).toBe(50 * 60);
      expect(result.session.cycleNumber).toBe(2); // Cycle increments when starting new WORK session!
    });

    it("prevents double-skip race condition when multiple participants call autoTransition simultaneously", () => {
      const now = baseSession.targetEndTime + 2500;

      // Participant A arrives first
      const resA = simulateAutoTransitionPhase(baseSession, {
        expectedStatus: "WORK",
        cadence: "50/10",
        now,
      });
      expect(resA.action).toBe("transitioned");
      expect(resA.session.status).toBe("BREAK");

      // Participant B, C, D submit same request with stale expectedStatus: "WORK"
      const resB = simulateAutoTransitionPhase(resA.session, {
        expectedStatus: "WORK",
        cadence: "50/10",
        now,
      });
      expect(resB.action).toBe("ignored"); // Safely ignored, does NOT skip Break!

      const resC = simulateAutoTransitionPhase(resA.session, {
        expectedStatus: "WORK",
        cadence: "50/10",
        now,
      });
      expect(resC.action).toBe("ignored");
    });

    it("does not transition if targetEndTime has not yet elapsed", () => {
      const now = baseSession.targetEndTime - 5000; // 5 seconds remaining
      const result = simulateAutoTransitionPhase(baseSession, {
        expectedStatus: "WORK",
        cadence: "50/10",
        now,
      });

      expect(result.action).toBe("ignored");
      expect(result.session.status).toBe("WORK");
    });

    it("resets abandoned session (>3 hours) to IDLE instead of cycling indefinitely", () => {
      const abandonedNow = baseSession.targetEndTime + 4 * 60 * 60 * 1000; // 4 hours later
      const result = simulateAutoTransitionPhase(baseSession, {
        expectedStatus: "WORK",
        cadence: "50/10",
        now: abandonedNow,
      });

      expect(result.action).toBe("reset_idle");
      expect(result.session.status).toBe("IDLE");
      expect(result.session.targetEndTime).toBe(0);
    });
  });
});
