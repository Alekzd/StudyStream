//
// SECURITY: LIVEKIT_API_SECRET is NEVER exposed to the client.
// Only this server action can issue LiveKit JWTs.
// Reference: 06_WebRTC_LiveKit_and_Media_Engine.md

import { action } from "./_generated/server";
import { v } from "convex/values";
import { AccessToken, TrackSource } from "livekit-server-sdk";

export const getRoomToken = action({
  args: {
    roomId: v.id("rooms"),
    roomSlug: v.string(),
    archetype: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Verify Clerk identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("UNAUTHORIZED: Vui lòng đăng nhập để vào phòng!");
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_WS_URL || process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
      throw new Error("LIVEKIT_NOT_CONFIGURED: Hệ thống chưa cấu hình LiveKit credentials.");
    }

    // 2. Set permissions based on room archetype
    // SILENT_FOCUS rooms: block microphone entirely
    const isSilentRoom = args.archetype === "SILENT_FOCUS";
    const canPublishSources: TrackSource[] = isSilentRoom
      ? [TrackSource.CAMERA]
      : [TrackSource.CAMERA, TrackSource.MICROPHONE, TrackSource.SCREEN_SHARE];

    // 3. Generate signed LiveKit JWT (4-hour TTL)
    const at = new AccessToken(apiKey, apiSecret, {
      identity: identity.subject,
      name: identity.name ?? "Anonymous Scholar",
      ttl: 4 * 60 * 60, // 4 hours in seconds
    });

    at.addGrant({
      roomJoin: true,
      room: `studystream_${args.roomSlug}`,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
      canPublishSources,
    });

    const token = await at.toJwt();

    return {
      token,
      serverUrl: wsUrl,
    };
  },
});
