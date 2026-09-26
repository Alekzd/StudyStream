"use client";
// app/providers.tsx
// StudyStream — Convex + Clerk combined provider

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://lovable-kudu-593.convex.cloud";
const convex = new ConvexReactClient(convexUrl);

function UserSyncWatcher() {
  const { isSignedIn, getToken } = useAuth();
  const syncUser = useMutation(api.users.syncCurrentUser);

  useEffect(() => {
    if (isSignedIn) {
      // Diagnostic check for Clerk <-> Convex token
      getToken({ template: "convex" })
        .then((token) => {
          if (!token) {
            console.error(
              "[StudyStream Auth] ❌ getToken({ template: 'convex' }) trả về NULL! " +
              "Nguyên nhân: Trong Clerk Dashboard (app full-ladybird-3422) CHƯA có JWT template tên là 'convex'."
            );
            return;
          }
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            console.log("[StudyStream Auth] ✅ Token payload:", payload);
            console.log("[StudyStream Auth] 🔍 iss:", payload.iss);
            console.log("[StudyStream Auth] 🔍 aud:", payload.aud);
            if (payload.aud !== "convex") {
              console.error(
                `[StudyStream Auth] ❌ Lỗi aud mismatch! Token có aud="${payload.aud}", nhưng Convex cần aud="convex". ` +
                "Vui lòng vào Clerk Dashboard -> JWT Templates -> 'convex' -> kiểm tra claims phải có: {\"aud\": \"convex\"}."
              );
            }
          } catch (e) {
            console.error("[StudyStream Auth] Không thể giải mã JWT:", e);
          }
        })
        .catch((err) => {
          console.error("[StudyStream Auth] Lỗi khi gọi getToken:", err);
        });

      syncUser().catch(() => {
        // Ignore if auth token not yet populated
      });
    }
  }, [isSignedIn, syncUser, getToken]);

  return null;
}

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <UserSyncWatcher />
      {children}
    </ConvexProviderWithClerk>
  );
}
