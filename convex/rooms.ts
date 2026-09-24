import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import {
  requireAuthUser,
  getAuthUser,
  requireServerRole,
  validateStringLength,
  formatDateKey,
  calculateNewStreak,
} from "./helpers";

const ROOM_ARCHETYPES = [
  "SILENT_FOCUS",
  "CAM_ACCOUNTABILITY",
  "SYNC_POMODORO",
  "AMBIENT_LOFI",
  "PAIR_SCREENSHARE",
  "SANDBOX_TEST",
] as const;

export const createRoom = mutation({
  args: {
    serverId: v.optional(v.id("servers")),
    categoryId: v.optional(v.id("roomCategories")),
    name: v.string(),
    archetype: v.union(...ROOM_ARCHETYPES.map((a) => v.literal(a))),
    maxParticipants: v.optional(v.number()),
    isLocked: v.optional(v.boolean()),
    password: v.optional(v.string()),
    pomodoroCadence: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);
    validateStringLength(args.name, 80, "name");

    let serverId = args.serverId;
    if (!serverId) {
      const publicServer = await ctx.db
        .query("servers")
        .withIndex("by_public", (q) => q.eq("isPublic", true))
        .first();
      if (publicServer) {
        serverId = publicServer._id;
      } else {
        // Fallback: create default commons server
        const now = Date.now();
        serverId = await ctx.db.insert("servers", {
          name: "StudyStream Commons",
          slug: "studystream-commons",
          description: "Unified public virtual study library for all scholars.",
          ownerId: user._id,
          inviteCode: "COMMONS",
          isPublic: true,
          defaultPomodoroWork: 50,
          defaultPomodoroBreak: 10,
          createdAt: now,
        });
      }
    }

    const sanitizedName = args.name
      .replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\uFE0F\uFE0E\s\u{1F1E6}-\u{1F1FF}]+/gu, "")
      .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\u200d\uFE0F\uFE0E\s\u{1F1E6}-\u{1F1FF}]+$/gu, "")
      .trim() || args.name.trim();

    const slug = sanitizedName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60);

    return ctx.db.insert("rooms", {
      serverId,
      categoryId: args.categoryId,
      name: sanitizedName,
      slug,
      archetype: args.archetype,
      maxParticipants: args.maxParticipants ?? 25,
      isLocked: args.isLocked ?? false,
      isSandbox: args.archetype === "SANDBOX_TEST",
      password: args.password?.trim() ? args.password.trim() : undefined,
      pomodoroCadence: args.pomodoroCadence ?? "50/10",
      currentHostId: user._id,
      createdAt: Date.now(),
    });
  },
});

export const getAllRooms = query({
  args: {},
  handler: async (ctx) => {
    const rooms = await ctx.db.query("rooms").order("desc").collect();

    const roomsWithCounts = await Promise.all(
      rooms.map(async (room) => {
        const participants = await ctx.db
          .query("roomParticipants")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .collect();
        return { ...room, participantCount: participants.length };
      })
    );

    // Sort crowded/active rooms first
    roomsWithCounts.sort((a, b) => (b.participantCount ?? 0) - (a.participantCount ?? 0));

    return roomsWithCounts;
  },
});

export const updateRoomCadence = mutation({
  args: {
    roomId: v.id("rooms"),
    cadence: v.string(), // "50/10", "25/5", "90/20"
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);
    validateStringLength(args.cadence, 20, "cadence");

    // Cadence format check e.g. "50/10"
    if (!/^\d{1,3}\/\d{1,3}$/.test(args.cadence.trim())) {
      throw new Error("INVALID_CADENCE: Chu kỳ Pomodoro không đúng định dạng (ví dụ: 50/10).");
    }

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("ROOM_NOT_FOUND");

    // Permission check: Host, server owner/moderator, or public room participant
    const isHost = room.currentHostId && room.currentHostId === user._id;
    if (!isHost) {
      const server = await ctx.db.get(room.serverId);
      const isPublicOrUnlocked = server?.isPublic || !room.isLocked;
      if (!isPublicOrUnlocked) {
        await requireServerRole(ctx, room.serverId, ["owner", "moderator"]);
      }
    }

    const trimmedCadence = args.cadence.trim();
    await ctx.db.patch(args.roomId, {
      pomodoroCadence: trimmedCadence,
    });

    // Also update any IDLE session for this room to match new duration
    const session = await ctx.db
      .query("pomodoroSessions")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .unique();

    const [w] = trimmedCadence.split("/").map((v) => parseInt(v, 10));
    const workSeconds = (w || 50) * 60;

    if (session) {
      if (session.status === "IDLE" || session.status === "PAUSED") {
        await ctx.db.patch(session._id, {
          durationSeconds: workSeconds,
          targetEndTime: 0,
          status: "IDLE",
          updatedAt: Date.now(),
        });
      }
    } else {
      await ctx.db.insert("pomodoroSessions", {
        roomId: args.roomId,
        status: "IDLE",
        durationSeconds: workSeconds,
        targetEndTime: 0,
        cycleNumber: 0,
        updatedAt: Date.now(),
      });
    }

    return true;
  },
});

export const seedDefaultRooms = mutation({
  args: {},
  handler: async (ctx) => {
    const existingRooms = await ctx.db.query("rooms").collect();
    if (existingRooms.length >= 4) {
      return { seeded: false, count: existingRooms.length };
    }

    // Find a public server to attach default rooms to
    let server = await ctx.db
      .query("servers")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .first();

    const now = Date.now();
    if (!server) {
      const defaultOwner = await ctx.db.query("users").first();
      let ownerId = defaultOwner?._id;
      if (!ownerId) {
        ownerId = await ctx.db.insert("users", {
          clerkId: "system_regional_bot",
          name: "StudyStream Atelier",
          email: "system@studystream.internal",
          globalRole: "admin",
          streakCount: 0,
          totalFocusMinutes: 0,
          createdAt: now,
          updatedAt: now,
        });
      }

      const serverId = await ctx.db.insert("servers", {
        name: "StudyStream Commons",
        slug: "studystream-commons",
        description: "Trạm làm việc chung không giới hạn của cộng đồng.",
        ownerId,
        inviteCode: "COMMONS",
        isPublic: true,
        defaultPomodoroWork: 50,
        defaultPomodoroBreak: 10,
        createdAt: now,
      });

      server = await ctx.db.get(serverId);
    }

    if (!server) return { seeded: false, count: 0 };

    const DEFAULT_ROOMS = [
      {
        name: "24/7 Silent Focus Sanctuary",
        archetype: "SILENT_FOCUS" as const,
        pomodoroCadence: "50/10",
        maxParticipants: 50,
      },
      {
        name: "Deep Work Pomodoro (50/10)",
        archetype: "SYNC_POMODORO" as const,
        pomodoroCadence: "50/10",
        maxParticipants: 35,
      },
      {
        name: "Classic Pomodoro Sprint (25/5)",
        archetype: "SYNC_POMODORO" as const,
        pomodoroCadence: "25/5",
        maxParticipants: 30,
      },
      {
        name: "Midnight Lofi & Rain Cafe",
        archetype: "AMBIENT_LOFI" as const,
        pomodoroCadence: "50/10",
        maxParticipants: 40,
      },
      {
        name: "Group Study & Screenshare",
        archetype: "PAIR_SCREENSHARE" as const,
        pomodoroCadence: "50/10",
        maxParticipants: 25,
      },
    ];

    let createdCount = 0;
    for (const r of DEFAULT_ROOMS) {
      const slug = r.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 60);

      const matched = existingRooms.find(
        (er) => er.name === r.name || (er.archetype === r.archetype && er.serverId === server._id)
      );
      if (!matched) {
        await ctx.db.insert("rooms", {
          serverId: server._id,
          name: r.name,
          slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
          archetype: r.archetype,
          maxParticipants: r.maxParticipants,
          isLocked: false,
          isSandbox: false,
          pomodoroCadence: r.pomodoroCadence,
          createdAt: now,
        });
        createdCount++;
      } else if (matched.name !== r.name && matched.serverId === server._id) {
        // Upgrade legacy room name with raw emoji to clean title
        await ctx.db.patch(matched._id, { name: r.name });
      }
    }

    return { seeded: true, createdCount };
  },
});

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

export const getRoomById = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.roomId);
  },
});

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

export const joinRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
    liveKitIdentity: v.string(),
    currentIntention: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);

    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("ROOM_NOT_FOUND");
    const isHost = Boolean(room.currentHostId && room.currentHostId === user._id);
    if (room.isLocked && !isHost) {
      if (room.password) {
        if (!args.password || args.password.trim() !== room.password) {
          throw new Error("INCORRECT_PASSWORD: Mật khẩu phòng không chính xác.");
        }
      } else {
        throw new Error("ROOM_LOCKED: This workstation is currently locked by the host.");
      }
    }

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

export const toggleRoomLock = mutation({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("ROOM_NOT_FOUND");

    // Allow host or server admin
    const isHost = room.currentHostId && room.currentHostId === user._id;
    if (!isHost) {
      await requireServerRole(ctx, room.serverId, ["owner", "moderator"]);
    }

    const nextLock = !room.isLocked;
    await ctx.db.patch(args.roomId, { isLocked: nextLock });
    return nextLock;
  },
});

export const deleteRoom = mutation({
  args: { roomId: v.id("rooms"), serverId: v.optional(v.id("servers")) },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);
    const room = await ctx.db.get(args.roomId);
    if (!room) throw new Error("ROOM_NOT_FOUND");

    const isHost = room.currentHostId && room.currentHostId === user._id;
    if (!isHost) {
      await requireServerRole(ctx, room.serverId, ["owner", "moderator"]);
    }

    // Clean up participants
    const participants = await ctx.db
      .query("roomParticipants")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect();
    for (const p of participants) {
      await ctx.db.delete(p._id);
    }

    await ctx.db.delete(args.roomId);
  },
});

export const getMyActiveParticipant = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthUser(ctx);
    if (!user) return null;

    const participant = await ctx.db
      .query("roomParticipants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!participant) return null;

    const room = await ctx.db.get(participant.roomId);
    if (!room) return null;

    return {
      participantId: participant._id,
      roomId: room._id,
      serverId: room.serverId,
      roomName: room.name,
      roomArchetype: room.archetype,
      roomSlug: room.slug,
      joinedAt: participant.joinedAt,
      liveKitIdentity: participant.liveKitIdentity,
    };
  },
});

export const cleanupStaleParticipants = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Purge ghost participants inactive / joined > 2 hours ago
    const cutoff = Date.now() - 2 * 60 * 60 * 1000;
    const staleParticipants = await ctx.db
      .query("roomParticipants")
      .filter((q) => q.lt(q.field("joinedAt"), cutoff))
      .collect();

    for (const p of staleParticipants) {
      await ctx.db.delete(p._id);
    }
  },
});

export const cleanupParticipantByIdentity = internalMutation({
  args: {
    liveKitIdentity: v.string(),
    roomName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const participants = await ctx.db
      .query("roomParticipants")
      .withIndex("by_liveKitIdentity", (q) =>
        q.eq("liveKitIdentity", args.liveKitIdentity)
      )
      .collect();

    for (const p of participants) {
      await ctx.db.delete(p._id);

      // Auto-log focus session if >= 2 minutes and not sandbox room
      const durationMs = Date.now() - p.joinedAt;
      const durationMinutes = Math.floor(durationMs / 60000);
      if (durationMinutes >= 2) {
        const room = await ctx.db.get(p.roomId);
        if (room && !room.isSandbox) {
          const user = await ctx.db.get(p.userId);
          if (user) {
            const now = new Date();
            const today = formatDateKey(now);
            const newStreak = calculateNewStreak(user.streakCount, user.lastStudyDate, today);

            const existingLog = await ctx.db
              .query("focusLogs")
              .withIndex("by_user_and_date", (q) =>
                q.eq("userId", user._id).eq("dateString", today)
              )
              .first();

            if (existingLog) {
              await ctx.db.patch(existingLog._id, {
                durationMinutes: existingLog.durationMinutes + durationMinutes,
                completedAt: Date.now(),
              });
            } else {
              await ctx.db.insert("focusLogs", {
                userId: user._id,
                roomId: room._id,
                serverId: room.serverId,
                durationMinutes,
                dateString: today,
                completedAt: Date.now(),
              });
            }

            await ctx.db.patch(user._id, {
              totalFocusMinutes: user.totalFocusMinutes + durationMinutes,
              streakCount: newStreak,
              lastStudyDate: today,
              updatedAt: Date.now(),
            });
          }
        }
      }
    }
  },
});

export const cleanupRoomParticipantsByName = internalMutation({
  args: { roomName: v.string() },
  handler: async (ctx, args) => {
    const slug = args.roomName.replace(/^studystream_/, "");
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    if (room) {
      const participants = await ctx.db
        .query("roomParticipants")
        .withIndex("by_room", (q) => q.eq("roomId", room._id))
        .collect();

      for (const p of participants) {
        await ctx.db.delete(p._id);
      }
    }
  },
});

export const leaveRoomBeacon = internalMutation({
  args: {
    roomId: v.string(),
    liveKitIdentity: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.liveKitIdentity) {
      const p = await ctx.db
        .query("roomParticipants")
        .withIndex("by_liveKitIdentity", (q) =>
          q.eq("liveKitIdentity", args.liveKitIdentity!)
        )
        .first();
      if (p) {
        await ctx.db.delete(p._id);
        return;
      }
    }

    // Fallback search by room and verified user ID (strictly requires args.userId)
    if (args.roomId && args.userId) {
      const normalizedRoomId = ctx.db.normalizeId("rooms", args.roomId);
      if (normalizedRoomId) {
        const participants = await ctx.db
          .query("roomParticipants")
          .withIndex("by_room", (q) => q.eq("roomId", normalizedRoomId))
          .collect();
        const match = participants.find(
          (p) =>
            String(p.userId) === args.userId || p.liveKitIdentity === args.userId
        );
        if (match) {
          await ctx.db.delete(match._id);
        }
      }
    }
  },
});

export const cleanupUserSession = internalMutation({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return;

    const participants = await ctx.db
      .query("roomParticipants")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    for (const p of participants) {
      await ctx.db.delete(p._id);
    }
  },
});
