// convex/chat.ts
// StudyStream OS — Room Chat mutations and queries

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuthUser, validateStringLength } from "./helpers";

// ─── SEND MESSAGE ────────────────────────────────────────────────────
export const sendMessage = mutation({
  args: {
    roomId: v.id("rooms"),
    serverId: v.id("servers"),
    content: v.string(),
    isSystemNotice: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthUser(ctx);
    validateStringLength(args.content, 2000, "content");

    return ctx.db.insert("chatMessages", {
      roomId: args.roomId,
      serverId: args.serverId,
      senderId: user._id,
      content: args.content.trim(),
      isSystemNotice: args.isSystemNotice ?? false,
      createdAt: Date.now(),
    });
  },
});

// ─── GET MESSAGES IN ROOM ────────────────────────────────────────────
export const getMessages = query({
  args: {
    roomId: v.id("rooms"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(args.limit ?? 50);

    const messagesWithSenders = await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return { ...msg, sender };
      })
    );

    return messagesWithSenders.reverse();
  },
});
