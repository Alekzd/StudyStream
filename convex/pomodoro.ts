import { mutation, query, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { requireAuthUser } from "./helpers";

async function requirePomodoroControl(
  ctx: MutationCtx,
  roomId: Id<"rooms">,
  serverId: Id<"servers">
) {
  const user = await requireAuthUser(ctx);
  const room = await ctx.db.get(roomId);
  if (!room) throw new Error("ROOM_NOT_FOUND");

  if (room.currentHostId && room.currentHostId === user._id) {
    return user;
  }

  const membership = await ctx.db
    .query("serverMembers")
    .withIndex("by_server_and_user", (q) =>
      q.eq("serverId", serverId).eq("userId", user._id)
    )
    .unique();

  if (membership && (membership.role === "owner" || membership.role === "moderator")) {
    return user;
  }

  const server = await ctx.db.get(serverId);
  if (server?.isPublic || !room.isLocked) {
    return user;
  }

  throw new Error("FORBIDDEN: Chỉ Host hoặc Quản trị viên mới được điều khiển Pomodoro.");
}

export const getPomodoroState = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("pomodoroSessions")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .unique();
  },
});

export const startSession = mutation({
  args: {
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
    phase: v.union(v.literal("WORK"), v.literal("BREAK")),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requirePomodoroControl(ctx, args.roomId, args.serverId);

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

export const pauseSession = mutation({
  args: {
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
  },
  handler: async (ctx, args) => {
    await requirePomodoroControl(ctx, args.roomId, args.serverId);

    const session = await ctx.db
      .query("pomodoroSessions")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .unique();

    if (!session || session.status === "IDLE") return;

    const remainingMs = session.targetEndTime - Date.now();
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    const currentPhase = session.status === "WORK" || session.status === "BREAK" ? session.status : undefined;

    await ctx.db.patch(session._id, {
      status: "PAUSED",
      durationSeconds: remainingSeconds, // Save remaining time for resume
      previousPhase: currentPhase,
      updatedAt: Date.now(),
    });
  },
});

export const resumeSession = mutation({
  args: {
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
  },
  handler: async (ctx, args) => {
    await requirePomodoroControl(ctx, args.roomId, args.serverId);

    const session = await ctx.db
      .query("pomodoroSessions")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .unique();

    if (!session || session.status !== "PAUSED") return;

    const remainingSeconds = session.durationSeconds > 0 ? session.durationSeconds : 60;
    const now = Date.now();
    const targetEndTime = now + remainingSeconds * 1000;
    const resumePhase = session.previousPhase || "WORK";

    await ctx.db.patch(session._id, {
      status: resumePhase,
      targetEndTime,
      updatedAt: now,
    });
  },
});

export const skipPhase = mutation({
  args: {
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
  },
  handler: async (ctx, args) => {
    await requirePomodoroControl(ctx, args.roomId, args.serverId);

    const session = await ctx.db
      .query("pomodoroSessions")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .unique();

    if (!session) return;

    const nextPhase = session.status === "WORK" ? "BREAK" : "WORK";

    const room = await ctx.db.get(args.roomId);
    let workMin = 50;
    let breakMin = 10;
    if (room?.pomodoroCadence) {
      const [w, b] = room.pomodoroCadence.split("/").map((v) => parseInt(v, 10));
      if (w) workMin = w;
      if (b) breakMin = b;
    }

    const durationMinutes = nextPhase === "WORK" ? workMin : breakMin;
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

export const autoTransitionPhase = mutation({
  args: {
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
    expectedStatus: v.union(v.literal("WORK"), v.literal("BREAK")),
  },
  handler: async (ctx, args) => {
    // Any authenticated participant in the room can trigger auto-transition
    await requireAuthUser(ctx);

    const session = await ctx.db
      .query("pomodoroSessions")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .unique();

    // Idempotency check 1: If session already transitioned or reset, abort
    if (!session || session.status !== args.expectedStatus) {
      return;
    }

    const now = Date.now();

    // Idempotency check 2: targetEndTime must have elapsed
    if (session.targetEndTime > now) {
      return;
    }

    // Edge case: If session expired over 3 hours ago with no activity, reset to IDLE
    if (now - session.targetEndTime > 3 * 60 * 60 * 1000) {
      await ctx.db.patch(session._id, {
        status: "IDLE",
        targetEndTime: 0,
        updatedAt: now,
      });
      return;
    }

    const nextPhase = session.status === "WORK" ? "BREAK" : "WORK";

    const room = await ctx.db.get(args.roomId);
    let workMin = 50;
    let breakMin = 10;
    if (room?.pomodoroCadence) {
      const [w, b] = room.pomodoroCadence.split("/").map((v) => parseInt(v, 10));
      if (w) workMin = w;
      if (b) breakMin = b;
    }

    const durationMinutes = nextPhase === "WORK" ? workMin : breakMin;
    const durationSeconds = durationMinutes * 60;

    await ctx.db.patch(session._id, {
      status: nextPhase,
      durationSeconds,
      targetEndTime: now + durationSeconds * 1000,
      cycleNumber: nextPhase === "WORK" ? session.cycleNumber + 1 : session.cycleNumber,
      updatedAt: now,
    });
  },
});

export const resetSession = mutation({
  args: {
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
  },
  handler: async (ctx, args) => {
    await requirePomodoroControl(ctx, args.roomId, args.serverId);

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
