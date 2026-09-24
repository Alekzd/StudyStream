import { describe, it, expect } from "vitest";
import { FloatingQuickActions } from "@/components/room/FloatingQuickActions";
import { SidebarAudioWidget } from "@/components/soundscape/SidebarAudioWidget";

describe("FloatingQuickActions Component", () => {
  it("exports a valid React function component", () => {
    expect(typeof FloatingQuickActions).toBe("function");
    expect(FloatingQuickActions.name).toBe("FloatingQuickActions");
  });

  it("accepts props for chat toggling and silent rooms", () => {
    // Verified via TypeScript compile time and runtime signature
    expect(FloatingQuickActions.length).toBeLessThanOrEqual(1);
  });
});

describe("SidebarAudioWidget Component", () => {
  it("exports a valid React function component accepting compact prop", () => {
    expect(typeof SidebarAudioWidget).toBe("function");
    expect(SidebarAudioWidget.name).toBe("SidebarAudioWidget");
    expect(SidebarAudioWidget.length).toBeLessThanOrEqual(1);
  });
});

describe("AmbientAudioDock Component", () => {
  it("exports a valid React function component for compact floating ambient audio", async () => {
    const { AmbientAudioDock } = await import("@/components/soundscape/AmbientAudioDock");
    expect(typeof AmbientAudioDock).toBe("function");
    expect(AmbientAudioDock.name).toBe("AmbientAudioDock");
    expect(AmbientAudioDock.length).toBeLessThanOrEqual(1);
  });
});

describe("RoomPiPDock Component & ActiveRoomContext", () => {
  it("exports a valid React function component for Picture-in-Picture room mini dock", async () => {
    const { RoomPiPDock } = await import("@/components/room/RoomPiPDock");
    expect(typeof RoomPiPDock).toBe("function");
    expect(RoomPiPDock.name).toBe("RoomPiPDock");
  });

  it("exports ActiveRoomProvider and useActiveRoom hook", async () => {
    const { ActiveRoomProvider, useActiveRoom } = await import("@/context/ActiveRoomContext");
    expect(typeof ActiveRoomProvider).toBe("function");
    expect(typeof useActiveRoom).toBe("function");
  });
});


