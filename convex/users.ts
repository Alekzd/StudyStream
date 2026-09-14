// convex/users.ts
// StudyStream OS — User mutations and queries

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUser, requireAuthUser } from "./helpers";

// Upsert user from Clerk webhook (user.created / user.updated)
export const upsertUser = mutation({
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

// Delete user from Clerk webhook (user.deleted)
export const deleteUser = mutation({
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
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);
    const today = new Date().toISOString().split("T")[0];

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
      });
    }

    // Update total minutes on user doc
    await ctx.db.patch(user._id, {
      totalFocusMinutes: user.totalFocusMinutes + args.durationMinutes,
      updatedAt: Date.now(),
    });
  },
});
