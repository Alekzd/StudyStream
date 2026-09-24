// SECURITY: All webhook payloads verified with Svix HMAC-SHA256 signature / LiveKit WebhookReceiver

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Webhook } from "svix";
import { WebhookReceiver } from "livekit-server-sdk";

const http = httpRouter();

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (!WEBHOOK_SECRET) {
      console.error("[clerk-webhook] CLERK_WEBHOOK_SIGNING_SECRET not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const body = await request.text();
    const svixId = request.headers.get("svix-id");
    const svixTimestamp = request.headers.get("svix-timestamp");
    const svixSignature = request.headers.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return new Response("Missing svix headers", { status: 400 });
    }

    // Cryptographic signature verification — prevents forged requests
    let evt: { type: string; data: Record<string, unknown> };
    try {
      const wh = new Webhook(WEBHOOK_SECRET);
      evt = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as unknown as { type: string; data: Record<string, unknown> };
    } catch (err) {
      console.error("[clerk-webhook] Invalid Svix signature:", err);
      return new Response("Invalid signature", { status: 401 });
    }

    if (evt.type === "user.created" || evt.type === "user.updated") {
      const data = evt.data as {
        id: string;
        email_addresses: Array<{ email_address: string }>;
        first_name?: string;
        last_name?: string;
        image_url?: string;
      };

      const email = data.email_addresses?.[0]?.email_address ?? "";
      const name =
        [data.first_name, data.last_name].filter(Boolean).join(" ") ||
        email.split("@")[0];

      await ctx.runMutation(internal.users.upsertUser, {
        clerkId: data.id,
        email,
        name,
        avatarUrl: data.image_url,
      });
    }

    if (evt.type === "user.deleted") {
      const data = evt.data as { id: string };
      await ctx.runMutation(internal.users.deleteUser, { clerkId: data.id });
    }

    // Cleanup active workstation participants if user logs off or session is revoked
    if (
      evt.type === "session.ended" ||
      evt.type === "session.removed" ||
      evt.type === "session.revoked"
    ) {
      const data = evt.data as { user_id?: string };
      if (data.user_id) {
        await ctx.runMutation(internal.rooms.cleanupUserSession, {
          clerkId: data.user_id,
        });
      }
    }

    return new Response("OK", { status: 200 });
  }),
});

http.route({
  path: "/livekit-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.warn("[livekit-webhook] LIVEKIT credentials not configured");
      return new Response("Not configured", { status: 500 });
    }

    const authHeader =
      request.headers.get("Authorization") || request.headers.get("Authorize");
    const body = await request.text();

    const receiver = new WebhookReceiver(apiKey, apiSecret);
    let event;
    try {
      event = await receiver.receive(body, authHeader || undefined);
    } catch (err) {
      console.error("[livekit-webhook] Signature verification failed:", err);
      return new Response("Invalid signature", { status: 401 });
    }

    // Participant abrupt disconnect or shutdown
    if (
      event.event === "participant_left" ||
      event.event === "participant_connection_aborted"
    ) {
      const identity = event.participant?.identity;
      if (identity) {
        await ctx.runMutation(internal.rooms.cleanupParticipantByIdentity, {
          liveKitIdentity: identity,
          roomName: event.room?.name,
        });
      }
    } else if (event.event === "room_finished") {
      if (event.room?.name) {
        await ctx.runMutation(internal.rooms.cleanupRoomParticipantsByName, {
          roomName: event.room.name,
        });
      }
    }

    return new Response("OK", { status: 200 });
  }),
});

http.route({
  path: "/api/leave-room",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const text = await request.text();
      const body = text ? JSON.parse(text) : {};
      if (body.roomId) {
        await ctx.runMutation(internal.rooms.leaveRoomBeacon, {
          roomId: body.roomId,
          liveKitIdentity: body.liveKitIdentity,
          userId: body.userId,
        });
      }
      return new Response("OK", {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    } catch {
      return new Response("Bad Request", { status: 400 });
    }
  }),
});

http.route({
  path: "/api/leave-room",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }),
});

export default http;
