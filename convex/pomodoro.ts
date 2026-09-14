// convex/pomodoro.ts
// StudyStream OS — Server-Authoritative Pomodoro Timer Engine
//
// DESIGN PRINCIPLE: The server stores `targetEndTime` (Epoch ms).
// Clients derive their countdown by computing: targetEndTime - Date.now()
// This eliminates clock drift — all clients share the same truth.
// Reference: 04_CSW_Core_Features_and_BodyDoubling.md

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuthUser, requireServerRole } from "./helpers";

// ─── GET POMODORO STATE ──────────────────────────────────────────────
export const getPomodoroState = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("pomodoroSessions")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .unique();
  },
});

// ─── START POMODORO ──────────────────────────────────────────────────
export const startSession = mutation({
  args: {
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
    phase: v.union(v.literal("WORK"), v.literal("BREAK")),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    // Only owner/moderator can control the room timer
    await requireServerRole(ctx, args.serverId, ["owner", "moderator"]);

    const user = await requireAuthUser(ctx);
    const now = Date.now();
    const durationSeconds = args.durationMinutes * 60;
    const targetEndTime = now + durationSeconds * 1000;

    const existing = await ctx.db
      .query("pomodoroSessions")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.phase,
        durationSeconds,
        targetEndTime,
        cycleNumber: existing.cycleNumber + (args.phase === "WORK" ? 1 : 0),
        startedBy: user._id,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("pomodoroSessions", {
        roomId: args.roomId,
        status: args.phase,
        durationSeconds,
        targetEndTime,
        cycleNumber: args.phase === "WORK" ? 1 : 0,
        startedBy: user._id,
        updatedAt: now,
      });
    }
  },
});

// ─── PAUSE POMODORO ──────────────────────────────────────────────────
export const pauseSession = mutation({
  args: {
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
  },
  handler: async (ctx, args) => {
    await requireServerRole(ctx, args.serverId, ["owner", "moderator"]);

    const session = await ctx.db
      .query("pomodoroSessions")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .unique();

    if (!session || session.status === "IDLE") return;

    const remainingMs = session.targetEndTime - Date.now();
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

    await ctx.db.patch(session._id, {
      status: "PAUSED",
      durationSeconds: remainingSeconds, // Save remaining time for resume
      updatedAt: Date.now(),
    });
  },
});

// ─── SKIP TO NEXT PHASE ──────────────────────────────────────────────
export const skipPhase = mutation({
  args: {
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
  },
  handler: async (ctx, args) => {
    await requireServerRole(ctx, args.serverId, ["owner", "moderator"]);

    const session = await ctx.db
      .query("pomodoroSessions")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .unique();

    if (!session) return;

    const nextPhase = session.status === "WORK" ? "BREAK" : "WORK";

    // Get server's default duration
    const server = await ctx.db
      .query("servers")
      .filter((q) => q.eq(q.field("_id"), args.serverId))
      .unique();

    const durationMinutes = nextPhase === "WORK"
      ? (server?.defaultPomodoroWork ?? 50)
      : (server?.defaultPomodoroBreak ?? 10);

    const durationSeconds = durationMinutes * 60;
    const now = Date.now();

    await ctx.db.patch(session._id, {
      status: nextPhase,
      durationSeconds,
      targetEndTime: now + durationSeconds * 1000,
      cycleNumber: nextPhase === "WORK" ? session.cycleNumber + 1 : session.cycleNumber,
      updatedAt: now,
    });
  },
});

// ─── RESET POMODORO ──────────────────────────────────────────────────
export const resetSession = mutation({
  args: {
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
  },
  handler: async (ctx, args) => {
    await requireServerRole(ctx, args.serverId, ["owner", "moderator"]);

    const session = await ctx.db
      .query("pomodoroSessions")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .unique();

    if (session) {
      await ctx.db.patch(session._id, {
        status: "IDLE",
        targetEndTime: 0,
        updatedAt: Date.now(),
      });
    }
  },
});
