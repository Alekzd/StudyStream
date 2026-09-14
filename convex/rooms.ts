// convex/rooms.ts
// StudyStream OS — Room (Study Space) mutations and queries

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuthUser, requireServerRole, validateStringLength } from "./helpers";

const ROOM_ARCHETYPES = [
  "SILENT_FOCUS",
  "CAM_ACCOUNTABILITY",
  "SYNC_POMODORO",
  "AMBIENT_LOFI",
  "PAIR_SCREENSHARE",
  "SANDBOX_TEST",
] as const;

// ─── CREATE ROOM ─────────────────────────────────────────────────────
export const createRoom = mutation({
  args: {
    serverId: v.id("servers"),
    categoryId: v.optional(v.id("roomCategories")),
    name: v.string(),
    archetype: v.union(...ROOM_ARCHETYPES.map((a) => v.literal(a))),
    maxParticipants: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireServerRole(ctx, args.serverId, ["owner", "moderator"]);
    validateStringLength(args.name, 80, "name");

    const slug = args.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60);

    return ctx.db.insert("rooms", {
      serverId: args.serverId,
      categoryId: args.categoryId,
      name: args.name,
      slug,
      archetype: args.archetype,
      maxParticipants: args.maxParticipants ?? 25,
      isLocked: false,
      isSandbox: args.archetype === "SANDBOX_TEST",
      currentHostId: user._id,
      createdAt: Date.now(),
    });
  },
});

// ─── GET ROOMS IN A SERVER ───────────────────────────────────────────
export const getRoomsInServer = query({
  args: { serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_server", (q) => q.eq("serverId", args.serverId))
      .collect();

    // Attach participant count per room
    const roomsWithCounts = await Promise.all(
      rooms.map(async (room) => {
        const participants = await ctx.db
          .query("roomParticipants")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .collect();
        return { ...room, participantCount: participants.length };
      })
    );

    return roomsWithCounts;
  },
});

// ─── GET CATEGORIES IN A SERVER ──────────────────────────────────────
export const getCategoriesInServer = query({
  args: { serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const categories = await ctx.db
      .query("roomCategories")
      .withIndex("by_server", (q) => q.eq("serverId", args.serverId))
      .collect();

    return categories.sort((a, b) => a.order - b.order);
  },
});

// ─── GET ROOM BY ID ──────────────────────────────────────────────────
export const getRoomById = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.roomId);
  },
});

// ─── GET ROOM PARTICIPANTS ───────────────────────────────────────────
export const getRoomParticipants = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    const users = await Promise.all(
      participants.map((p) => ctx.db.get(p.userId))
    );

    return participants.map((p, i) => ({
      ...p,
      user: users[i],
    }));
  },
});

// ─── JOIN ROOM ───────────────────────────────────────────────────────
export const joinRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
    liveKitIdentity: v.string(),
    currentIntention: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("ROOM_NOT_FOUND");
    if (room.isLocked) throw new Error("ROOM_LOCKED: Phòng này đang bị khóa.");

    // Check capacity
    const current = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();

    if (current.length >= room.maxParticipants) {
      throw new Error("ROOM_FULL: Phòng đã đạt giới hạn người tham gia.");
    }

    // Remove existing participant record if any (re-join)
    const existing = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", user._id)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    const now = Date.now();
    return ctx.db.insert("roomParticipants", {
      roomId: args.roomId,
      serverId: args.serverId,
      userId: user._id,
      liveKitIdentity: args.liveKitIdentity,
      currentIntention: args.currentIntention,
      isCameraOn: true,
      isMicOn: room.archetype !== "SILENT_FOCUS",
      isScreenSharing: false,
      joinedAt: now,
      lastHeartbeat: now,
    });
  },
});

// ─── LEAVE ROOM ──────────────────────────────────────────────────────
export const leaveRoom = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);

    const participant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", user._id)
      )
      .unique();

    if (participant) {
      await ctx.db.delete(participant._id);
    }
  },
});

// ─── UPDATE MEDIA STATE ──────────────────────────────────────────────
export const updateMediaState = mutation({
  args: {
    roomId: v.id("rooms"),
    isCameraOn: v.optional(v.boolean()),
    isMicOn: v.optional(v.boolean()),
    isScreenSharing: v.optional(v.boolean()),
    currentIntention: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);

    const participant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room_and_user", (q) =>
        q.eq("roomId", args.roomId).eq("userId", user._id)
      )
      .unique();

    if (!participant) throw new Error("NOT_IN_ROOM");

    const updates: Partial<typeof participant> = {};
    if (args.isCameraOn !== undefined) updates.isCameraOn = args.isCameraOn;
    if (args.isMicOn !== undefined) updates.isMicOn = args.isMicOn;
    if (args.isScreenSharing !== undefined) updates.isScreenSharing = args.isScreenSharing;
    if (args.currentIntention !== undefined) updates.currentIntention = args.currentIntention;

    await ctx.db.patch(participant._id, updates);
  },
});

// ─── DELETE ROOM (Owner/Mod only) ────────────────────────────────────
export const deleteRoom = mutation({
  args: { roomId: v.id("rooms"), serverId: v.id("servers") },
  handler: async (ctx, args) => {
    await requireServerRole(ctx, args.serverId, ["owner", "moderator"]);
    await ctx.db.delete(args.roomId);
  },
});
