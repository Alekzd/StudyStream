import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import {
  requireAuthUser,
  requireServerRole,
  generateInviteCode,
  validateStringLength,
} from "./helpers";

export const createServer = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    defaultPomodoroWork: v.optional(v.number()),
    defaultPomodoroBreak: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);
    validateStringLength(args.name, 80, "name");
    validateStringLength(args.description, 500, "description");

    const slug = args.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60);

    const inviteCode = generateInviteCode();
    const now = Date.now();

    const serverId = await ctx.db.insert("servers", {
      name: args.name,
      slug,
      description: args.description,
      ownerId: user._id,
      inviteCode,
      isPublic: args.isPublic ?? true,
      defaultPomodoroWork: args.defaultPomodoroWork ?? 50,
      defaultPomodoroBreak: args.defaultPomodoroBreak ?? 10,
      createdAt: now,
    });

    // Auto-join as Owner
    await ctx.db.insert("serverMembers", {
      serverId,
      userId: user._id,
      role: "owner",
      joinedAt: now,
    });

    // Create default categories
    await ctx.db.insert("roomCategories", {
      serverId,
      name: "Khu Tập Trung",
      order: 0,
    });
    await ctx.db.insert("roomCategories", {
      serverId,
      name: "Pomodoro Zone",
      order: 1,
    });
    await ctx.db.insert("roomCategories", {
      serverId,
      name: "Test Zone",
      order: 2,
    });

    return serverId;
  },
});

export const joinByCode = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);

    const server = await ctx.db
      .query("servers")
      .withIndex("by_inviteCode", (q) => q.eq("inviteCode", args.inviteCode.toUpperCase()))
      .unique();

    if (!server) {
      throw new Error("INVITE_NOT_FOUND: Mã mời không hợp lệ hoặc đã hết hạn.");
    }

    // Check already a member
    const existing = await ctx.db
      .query("serverMembers")
      .withIndex("by_server_and_user", (q) =>
        q.eq("serverId", server._id).eq("userId", user._id)
      )
      .unique();

    if (existing) {
      return { serverId: server._id, alreadyMember: true };
    }

    await ctx.db.insert("serverMembers", {
      serverId: server._id,
      userId: user._id,
      role: "member",
      joinedAt: Date.now(),
    });

    return { serverId: server._id, alreadyMember: false };
  },
});

export const getMyServers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return [];

    const memberships = await ctx.db
      .query("serverMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const servers = await Promise.all(
      memberships.map((m) => ctx.db.get(m.serverId))
    );

    return servers.filter(Boolean).map((s, i) => ({
      ...s!,
      role: memberships[i].role,
    }));
  },
});

export const getServerById = query({
  args: { serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const server = await ctx.db.get(args.serverId);
    if (!server) return null;

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return server.isPublic ? server : null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return server.isPublic ? server : null;

    const membership = await ctx.db
      .query("serverMembers")
      .withIndex("by_server_and_user", (q) =>
        q.eq("serverId", args.serverId).eq("userId", user._id)
      )
      .unique();

    return membership ? { ...server, myRole: membership.role } : (server.isPublic ? server : null);
  },
});

export const getCentralServer = query({
  args: {},
  handler: async (ctx) => {
    const server = await ctx.db
      .query("servers")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .first();
    return server;
  },
});

export const getOrCreateCentralServer = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("servers")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .first();
    if (existing) return existing._id;

    const identity = await ctx.auth.getUserIdentity();
    let ownerId: Id<"users"> | undefined;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();
      if (user) ownerId = user._id;
    }
    if (!ownerId) {
      const firstUser = await ctx.db.query("users").first();
      if (firstUser) ownerId = firstUser._id;
    }

    const now = Date.now();
    if (!ownerId) {
      ownerId = await ctx.db.insert("users", {
        clerkId: "system_commons_bot",
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
      description: "Unified public virtual study library for all scholars.",
      ownerId,
      inviteCode: "COMMONS",
      isPublic: true,
      defaultPomodoroWork: 50,
      defaultPomodoroBreak: 10,
      createdAt: now,
    });

    return serverId;
  },
});

export const DEFAULT_REGIONAL_SERVERS = [
  {
    name: "Vietnam Campus",
    slug: "vietnam",
    description: "Cộng đồng học tập Việt Nam (Hà Nội, TP.HCM - Múi giờ GMT+7).",
    inviteCode: "VN2026",
  },
  {
    name: "Global Commons",
    slug: "global",
    description: "Worldwide 24/7 Virtual Library for international scholars.",
    inviteCode: "GLOBAL",
  },
  {
    name: "Tokyo Atelier",
    slug: "japan-korea",
    description: "East Asia focus hub (Japan / Korea - JST/KST GMT+9).",
    inviteCode: "TOKYO",
  },
  {
    name: "Americas Hub",
    slug: "north-america",
    description: "North America regional study hub (EST / CST / PST).",
    inviteCode: "USAHUB",
  },
  {
    name: "Europe Library",
    slug: "europe",
    description: "European regional study lounge (UK, Germany, France - CET/BST).",
    inviteCode: "EUROPE",
  },
];

export const getRegionalServers = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query("servers")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();
  },
});

export const seedRegionalServers = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("servers")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    const identity = await ctx.auth.getUserIdentity();
    let ownerId: Id<"users"> | undefined;
    if (identity) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
        .unique();
      if (user) ownerId = user._id;
    }
    if (!ownerId) {
      const firstUser = await ctx.db.query("users").first();
      if (firstUser) ownerId = firstUser._id;
    }

    const now = Date.now();
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

    for (const reg of DEFAULT_REGIONAL_SERVERS) {
      const found = existing.find((s) => s.slug === reg.slug);
      if (!found) {
        await ctx.db.insert("servers", {
          name: reg.name,
          slug: reg.slug,
          description: reg.description,
          ownerId,
          inviteCode: reg.inviteCode,
          isPublic: true,
          defaultPomodoroWork: 50,
          defaultPomodoroBreak: 10,
          createdAt: now,
        });
      } else if (found.name !== reg.name) {
        // Upgrade existing server record to clean name without raw emoji
        await ctx.db.patch(found._id, { name: reg.name });
      }
    }
  },
});

export const getPublicServers = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return ctx.db
      .query("servers")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .take(args.limit ?? 20);
  },
});

export const deleteServer = mutation({
  args: { serverId: v.id("servers") },
  handler: async (ctx, args) => {
    await requireServerRole(ctx, args.serverId, ["owner"]);
    await ctx.db.delete(args.serverId);
  },
});

export const getServerMembers = query({
  args: { serverId: v.id("servers") },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("serverMembers")
      .withIndex("by_server", (q) => q.eq("serverId", args.serverId))
      .collect();

    const users = await Promise.all(
      memberships.map((m) => ctx.db.get(m.userId))
    );

    return memberships.map((m, i) => ({
      ...m,
      user: users[i],
    }));
  },
});
