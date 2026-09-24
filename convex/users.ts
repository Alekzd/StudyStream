import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser, requireAuthUser, formatDateKey, calculateNewStreak } from "./helpers";

export const upsertUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email: args.email,
        name: args.name,
        avatarUrl: args.avatarUrl,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      avatarUrl: args.avatarUrl,
      globalRole: "user",
      streakCount: 0,
      totalFocusMinutes: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const deleteUser = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (user) {
      await ctx.db.delete(user._id);
    }
  },
});

export const syncCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    return await requireAuthUser(ctx);
  },
});

// Get current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return getAuthUser(ctx);
  },
});

// Get user by ID
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.userId);
  },
});

// Get leaderboard: top users by streak
export const getStreakLeaderboard = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_streak")
      .order("desc")
      .take(args.limit ?? 10);
  },
});

// Update user's total focus time (called when completing a pomodoro)
export const updateFocusStats = mutation({
  args: {
    durationMinutes: v.number(),
    roomId: v.optional(v.id("rooms")),
    serverId: v.optional(v.id("servers")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);
    const now = new Date();
    const today = formatDateKey(now);

    // Rule 5: Sandbox rooms don't count toward streak/focus logs
    if (args.roomId) {
      const room = await ctx.db.get(args.roomId);
      if (room?.isSandbox) {
        return { isSandbox: true, logged: false };
      }
    }

    // Update streak
    const newStreak = calculateNewStreak(user.streakCount, user.lastStudyDate, today);

    // Check if already logged focus today
    const existingLog = await ctx.db
      .query("focusLogs")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("dateString", today)
      )
      .first();

    if (existingLog) {
      await ctx.db.patch(existingLog._id, {
        durationMinutes: existingLog.durationMinutes + args.durationMinutes,
        completedAt: Date.now(),
      });
    } else if (args.roomId && args.serverId) {
      await ctx.db.insert("focusLogs", {
        userId: user._id,
        roomId: args.roomId,
        serverId: args.serverId,
        durationMinutes: args.durationMinutes,
        dateString: today,
        completedAt: Date.now(),
      });
    }

    // Update total minutes, streak, and lastStudyDate on user doc
    await ctx.db.patch(user._id, {
      totalFocusMinutes: user.totalFocusMinutes + args.durationMinutes,
      streakCount: newStreak,
      lastStudyDate: today,
      updatedAt: Date.now(),
    });

    return { isSandbox: false, logged: true, streak: newStreak };
  },
});

// Get recent focus logs for current user (for activity heatmap)
export const getMyFocusLogs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getAuthUser(ctx);
    if (!user) return [];

    return ctx.db
      .query("focusLogs")
      .withIndex("by_user_and_date", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 90);
  },
});

export const getDashboardSync = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    const now = new Date();
    const today = formatDateKey(now);

    const activeParticipants = await ctx.db.query("roomParticipants").collect();
    const totalActiveScholars = activeParticipants.length;

    if (!user) {
      return {
        totalActiveScholars,
        todayFocusMinutes: 0,
        streakCount: 0,
        totalFocusMinutes: 0,
        activeParticipant: null,
      };
    }

    const todayLog = await ctx.db
      .query("focusLogs")
      .withIndex("by_user_and_date", (q) =>
        q.eq("userId", user._id).eq("dateString", today)
      )
      .first();

    const myParticipant = activeParticipants.find((p) => p.userId === user._id);
    let activeRoom = null;
    if (myParticipant) {
      const room = await ctx.db.get(myParticipant.roomId);
      if (room) {
        activeRoom = {
          roomId: room._id,
          serverId: room.serverId,
          roomName: room.name,
          roomArchetype: room.archetype,
          joinedAt: myParticipant.joinedAt,
        };
      }
    }

    return {
      totalActiveScholars,
      todayFocusMinutes: todayLog?.durationMinutes ?? 0,
      streakCount: user.streakCount,
      totalFocusMinutes: user.totalFocusMinutes,
      activeParticipant: activeRoom,
    };
  },
});
