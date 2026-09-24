"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export interface ActiveRoomSession {
  roomId: string;
  serverId: string;
  roomName: string;
  roomArchetype: string;
  roomSlug?: string;
  joinedAt: number;
  liveKitIdentity?: string | null;
  livekitToken?: string | null;
  livekitUrl?: string | null;
}

interface ActiveRoomContextType {
  activeRoom: ActiveRoomSession | null;
  setActiveRoom: (
    sessionOrUpdater:
      | ActiveRoomSession
      | null
      | ((prev: ActiveRoomSession | null) => ActiveRoomSession | null)
  ) => void;
  leaveActiveRoom: () => Promise<void>;
}

const ActiveRoomContext = createContext<ActiveRoomContextType | undefined>(undefined);

export function ActiveRoomProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, userId } = useAuth();
  const activeParticipant = useQuery(api.rooms.getMyActiveParticipant);
  const leaveRoomMutation = useMutation(api.rooms.leaveRoom);

  const [localRoom, setLocalRoom] = useState<ActiveRoomSession | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("studystream_active_room");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return null;
  });

  // Derived active room: Convex presence is the reactive source of truth
  const activeRoom = useMemo<ActiveRoomSession | null>(() => {
    if (isSignedIn === false) return null;
    if (activeParticipant === null) return null;
    if (activeParticipant) {
      return {
        roomId: activeParticipant.roomId,
        serverId: activeParticipant.serverId,
        roomName: activeParticipant.roomName,
        roomArchetype: activeParticipant.roomArchetype,
        roomSlug: activeParticipant.roomSlug,
        joinedAt: activeParticipant.joinedAt,
        liveKitIdentity: activeParticipant.liveKitIdentity,
      };
    }
    return localRoom;
  }, [isSignedIn, activeParticipant, localRoom]);

  // Sync sessionStorage whenever activeRoom changes
  useEffect(() => {
    try {
      if (activeRoom) {
        sessionStorage.setItem("studystream_active_room", JSON.stringify(activeRoom));
      } else {
        sessionStorage.removeItem("studystream_active_room");
      }
    } catch {}
  }, [activeRoom]);

  // Tab Close / PageHide Beacon: Send instant non-blocking exit beacon on tab close
  useEffect(() => {
    const handlePageHide = () => {
      if (!activeRoom?.roomId) return;
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (!convexUrl) return;

      const siteUrl = convexUrl.replace(".cloud", ".site");
      const payload = JSON.stringify({
        roomId: activeRoom.roomId,
        liveKitIdentity: activeRoom.liveKitIdentity || userId || undefined,
        userId: userId || undefined,
      });

      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(`${siteUrl}/api/leave-room`, blob);
      } else {
        fetch(`${siteUrl}/api/leave-room`, {
          method: "POST",
          body: payload,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);
    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [activeRoom?.roomId, activeRoom?.liveKitIdentity, userId]);

  const setActiveRoom = useCallback(
    (
      sessionOrUpdater:
        | ActiveRoomSession
        | null
        | ((prev: ActiveRoomSession | null) => ActiveRoomSession | null)
    ) => {
      setLocalRoom((prev) => {
        return typeof sessionOrUpdater === "function"
          ? sessionOrUpdater(prev)
          : sessionOrUpdater;
      });
    },
    []
  );

  const leaveActiveRoom = useCallback(async () => {
    setLocalRoom(null);
    if (activeRoom?.roomId) {
      leaveRoomMutation({ roomId: activeRoom.roomId as Id<"rooms"> }).catch((err) => {
        console.error("Failed to leave room session:", err);
      });
    }
    try {
      sessionStorage.removeItem("studystream_active_room");
    } catch {}
  }, [activeRoom, leaveRoomMutation]);

  const value = useMemo(
    () => ({
      activeRoom,
      setActiveRoom,
      leaveActiveRoom,
    }),
    [activeRoom, setActiveRoom, leaveActiveRoom]
  );

  return (
    <ActiveRoomContext.Provider value={value}>
      {children}
    </ActiveRoomContext.Provider>
  );
}

export function useActiveRoom() {
  const ctx = useContext(ActiveRoomContext);
  if (!ctx) {
    throw new Error("useActiveRoom must be used within an ActiveRoomProvider");
  }
  return ctx;
}
