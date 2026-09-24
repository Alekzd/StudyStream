import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatarUrl: v.optional(v.string()),
    globalRole: v.union(v.literal("admin"), v.literal("user")),
    streakCount: v.number(),
    lastStudyDate: v.optional(v.string()),
    totalFocusMinutes: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_streak", ["streakCount"]),

  servers: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    iconUrl: v.optional(v.string()),
    ownerId: v.id("users"),
    inviteCode: v.string(),
    isPublic: v.boolean(),
    defaultPomodoroWork: v.number(),
    defaultPomodoroBreak: v.number(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_inviteCode", ["inviteCode"])
    .index("by_owner", ["ownerId"])
    .index("by_public", ["isPublic"]),

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

  roomCategories: defineTable({
    serverId: v.id("servers"),
    name: v.string(),
    order: v.number(),
  }).index("by_server", ["serverId"]),

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
    password: v.optional(v.string()),
    pomodoroCadence: v.optional(v.string()),
    currentHostId: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_server", ["serverId"])
    .index("by_category", ["categoryId"])
    .index("by_archetype", ["archetype"])
    .index("by_slug", ["slug"]),

  roomParticipants: defineTable({
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
    userId: v.id("users"),
    liveKitIdentity: v.string(),
    currentIntention: v.optional(v.string()),
    isCameraOn: v.boolean(),
    isMicOn: v.boolean(),
    isScreenSharing: v.boolean(),
    joinedAt: v.number(),
    lastHeartbeat: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_liveKitIdentity", ["liveKitIdentity"])
    .index("by_room_and_user", ["roomId", "userId"])
    .index("by_heartbeat", ["lastHeartbeat"]),

  pomodoroSessions: defineTable({
    roomId: v.id("rooms"),
    status: v.union(
      v.literal("IDLE"),
      v.literal("WORK"),
      v.literal("BREAK"),
      v.literal("PAUSED")
    ),
    durationSeconds: v.number(),
    targetEndTime: v.number(),
    cycleNumber: v.number(),
    previousPhase: v.optional(v.union(v.literal("WORK"), v.literal("BREAK"))),
    startedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  }).index("by_room", ["roomId"]),

  chatMessages: defineTable({
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
    senderId: v.id("users"),
    content: v.string(),
    isSystemNotice: v.boolean(),
    createdAt: v.number(),
  }).index("by_room", ["roomId", "createdAt"]),

  focusLogs: defineTable({
    userId: v.id("users"),
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
    durationMinutes: v.number(),
    dateString: v.string(),
    completedAt: v.number(),
  })
    .index("by_user_and_date", ["userId", "dateString"])
    .index("by_server", ["serverId"]),

  streaks: defineTable({
    userId: v.id("users"),
    date: v.string(),
    minutesStudied: v.number(),
    status: v.literal("COMPLETED"),
  }).index("by_user_and_date", ["userId", "date"]),
});
