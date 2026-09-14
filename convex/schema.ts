// convex/schema.ts
// StudyStream OS — Reactive Database Schema v1.0
// Based on: 05_Database_Schema_Convex_Realtime.md from vault documentation

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── TABLE 1: USERS ───────────────────────────────────────────────
  // Synced from Clerk IdP via Svix webhook
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    globalRole: v.union(v.literal("admin"), v.literal("user")),
    streakCount: v.number(),
    lastStudyDate: v.optional(v.string()), // YYYY-MM-DD
    totalFocusMinutes: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_streak", ["streakCount"]),

  // ─── TABLE 2: STUDY SERVERS (Hubs / Campuses) ─────────────────────
  servers: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    ownerId: v.id("users"),
    inviteCode: v.string(), // 6-char unique code e.g. "BK2026"
    isPublic: v.boolean(),
    defaultPomodoroWork: v.number(),  // default 50 min
    defaultPomodoroBreak: v.number(), // default 10 min
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_inviteCode", ["inviteCode"])
    .index("by_owner", ["ownerId"])
    .index("by_public", ["isPublic"]),

  // ─── TABLE 3: SERVER MEMBERS (User <-> Server relationship) ───────
  serverMembers: defineTable({
    serverId: v.id("servers"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("moderator"),
      v.literal("member"),
      v.literal("guest")
    ),
    joinedAt: v.number(),
  })
    .index("by_server", ["serverId"])
    .index("by_user", ["userId"])
    .index("by_server_and_user", ["serverId", "userId"]),

  // ─── TABLE 4: ROOM CATEGORIES (Folder-like grouping) ──────────────
  roomCategories: defineTable({
    serverId: v.id("servers"),
    name: v.string(), // e.g. "Khu Im Lặng", "Pomodoro Zone"
    order: v.number(),
  }).index("by_server", ["serverId"]),

  // ─── TABLE 5: STUDY ROOMS ──────────────────────────────────────────
  rooms: defineTable({
    serverId: v.id("servers"),
    categoryId: v.optional(v.id("roomCategories")),
    name: v.string(),
    slug: v.string(),
    archetype: v.union(
      v.literal("SILENT_FOCUS"),
      v.literal("CAM_ACCOUNTABILITY"),
      v.literal("SYNC_POMODORO"),
      v.literal("AMBIENT_LOFI"),
      v.literal("PAIR_SCREENSHARE"),
      v.literal("SANDBOX_TEST")
    ),
    maxParticipants: v.number(),
    isLocked: v.boolean(),
    isSandbox: v.boolean(),
    currentHostId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_server", ["serverId"])
    .index("by_category", ["categoryId"])
    .index("by_archetype", ["archetype"]),

  // ─── TABLE 6: ROOM PARTICIPANTS (Realtime Presence) ────────────────
  // CRITICAL: No heartbeat pings! Join/leave events only.
  // See Note 09: Capacity Planning to avoid burning Convex Free Tier writes.
  roomParticipants: defineTable({
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
    userId: v.id("users"),
    liveKitIdentity: v.string(),
    currentIntention: v.optional(v.string()), // e.g. "Ôn thi Giải Tích 2"
    isCameraOn: v.boolean(),
    isMicOn: v.boolean(),
    isScreenSharing: v.boolean(),
    joinedAt: v.number(),
    lastHeartbeat: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_and_user", ["roomId", "userId"])
    .index("by_heartbeat", ["lastHeartbeat"]),

  // ─── TABLE 7: POMODORO SESSIONS (Server-authoritative timer) ───────
  pomodoroSessions: defineTable({
    roomId: v.id("rooms"),
    status: v.union(
      v.literal("IDLE"),
      v.literal("WORK"),
      v.literal("BREAK"),
      v.literal("PAUSED")
    ),
    durationSeconds: v.number(),
    targetEndTime: v.number(), // Epoch ms — clients derive countdown from this
    cycleNumber: v.number(),
    startedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  }).index("by_room", ["roomId"]),

  // ─── TABLE 8: CHAT MESSAGES ────────────────────────────────────────
  chatMessages: defineTable({
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
    senderId: v.id("users"),
    content: v.string(),
    isSystemNotice: v.boolean(),
    createdAt: v.number(),
  }).index("by_room", ["roomId", "createdAt"]),

  // ─── TABLE 9: FOCUS LOGS (For heatmap & analytics) ─────────────────
  focusLogs: defineTable({
    userId: v.id("users"),
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
    durationMinutes: v.number(),
    dateString: v.string(), // YYYY-MM-DD
    completedAt: v.number(),
  })
    .index("by_user_and_date", ["userId", "dateString"])
    .index("by_server", ["serverId"]),

  // ─── TABLE 10: STREAKS LEDGER ──────────────────────────────────────
  streaks: defineTable({
    userId: v.id("users"),
    date: v.string(), // YYYY-MM-DD
    minutesStudied: v.number(),
    status: v.literal("COMPLETED"),
  }).index("by_user_and_date", ["userId", "date"]),
});
