// All mutations that change server state MUST use these guards.

import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export async function requireAuthUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("UNAUTHORIZED: Vui lòng đăng nhập tài khoản Clerk!");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    // JIT Provisioning: if user is authenticated via Clerk but webhook hasn't run yet
    if ("insert" in ctx.db) {
      const now = Date.now();
      const userId = await (ctx as MutationCtx).db.insert("users", {
        clerkId: identity.subject,
        email: identity.email ?? `${identity.subject}@clerk.user`,
        name: identity.name ?? identity.nickname ?? "Anonymous Scholar",
        avatarUrl: identity.pictureUrl,
        globalRole: "user",
        streakCount: 0,
        totalFocusMinutes: 0,
        createdAt: now,
        updatedAt: now,
      });
      return (await (ctx as MutationCtx).db.get(userId))!;
    }
    throw new Error("USER_NOT_FOUND: Hồ sơ người dùng chưa được đồng bộ. Vui lòng đợi vài giây!");
  }

  return user;
}

export async function getAuthUser(ctx: QueryCtx | MutationCtx) {
  try {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .unique();
  } catch {
    return null;
  }
}

export async function requireServerRole(
  ctx: QueryCtx | MutationCtx,
  serverId: Id<"servers">,
  allowedRoles: ("owner" | "moderator" | "member" | "guest")[]
) {
  const user = await requireAuthUser(ctx);

  const membership = await ctx.db
    .query("serverMembers")
    .withIndex("by_server_and_user", (q) =>
      q.eq("serverId", serverId).eq("userId", user._id)
    )
    .unique();

  if (!membership || !allowedRoles.includes(membership.role)) {
    throw new Error("FORBIDDEN: Bạn không có quyền thực hiện tác vụ này trong Server!");
  }

  return { user, membership };
}

export function validateStringLength(value: string | undefined, max: number, field: string) {
  if (value && value.length > max) {
    throw new Error(`VALIDATION_ERROR: Trường "${field}" vượt quá ${max} ký tự.`);
  }
}

export function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function formatDateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function calculateNewStreak(
  currentStreak: number,
  lastStudyDate: string | undefined,
  today: string
): number {
  if (!lastStudyDate) return 1;
  if (lastStudyDate === today) return currentStreak;

  const last = new Date(lastStudyDate);
  const todayDate = new Date(today);
  const diffDays = Math.floor(
    (todayDate.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  );

  return diffDays === 1 ? currentStreak + 1 : 1;
}
