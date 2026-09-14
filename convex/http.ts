// convex/http.ts
// StudyStream OS — HTTP Router for Clerk webhook sync
// SECURITY: All webhook payloads verified with Svix HMAC-SHA256 signature

import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { Webhook } from "svix";

const http = httpRouter();

// ─── CLERK WEBHOOK: Sync users on sign-up / update / delete ─────────
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

    // ✅ Cryptographic signature verification — prevents forged requests
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

      await ctx.runMutation(api.users.upsertUser, {
        clerkId: data.id,
        email,
        name,
        avatarUrl: data.image_url,
      });
    }

    if (evt.type === "user.deleted") {
      const data = evt.data as { id: string };
      await ctx.runMutation(api.users.deleteUser, { clerkId: data.id });
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
