"use client";
// components/room/StudyVideoGrid.tsx
// StudyStream OS — LiveKit WebRTC Video Grid Component
//
// Reference: 06_WebRTC_LiveKit_and_Media_Engine.md
// Uses @livekit/components-react for reliable WebRTC integration
// Adaptive Simulcast: thumbnail grid auto-downscales to 180p @ 90Kbps

import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";

interface StudyVideoGridProps {
  serverUrl: string;
  token: string;
  roomArchetype: string;
  isSensoryFriendly?: boolean;
  onDisconnect?: () => void;
}

export function StudyVideoGrid({
  serverUrl,
  token,
  roomArchetype,
  isSensoryFriendly = false,
  onDisconnect,
}: StudyVideoGridProps) {
  const isSilentRoom = roomArchetype === "SILENT_FOCUS";

  return (
    <LiveKitRoom
      video={true}
      audio={!isSilentRoom}
      token={token}
      serverUrl={serverUrl}
      connect={true}
      data-lk-theme="default"
      className="h-full w-full"
      style={{
        "--lk-bg": "#0a0a0a",
        "--lk-border-color": "#262626",
      } as React.CSSProperties}
      onDisconnected={onDisconnect}
    >
      <VideoGridInner isSensoryFriendly={isSensoryFriendly} />
      <RoomAudioRenderer />
      <ControlBar
        controls={{
          microphone: !isSilentRoom,
          camera: true,
          screenShare: roomArchetype === "PAIR_SCREENSHARE",
          chat: false,
          leave: true,
        }}
      />
    </LiveKitRoom>
  );
}

function VideoGridInner({ isSensoryFriendly }: { isSensoryFriendly: boolean }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <div className="h-full p-3">
      <GridLayout
        tracks={tracks}
        style={{ height: "calc(100% - 0px)" }}
      >
        <ParticipantTile
          style={{
            filter: isSensoryFriendly ? "brightness(0.85) saturate(0.9)" : undefined,
          }}
        />
      </GridLayout>
    </div>
  );
}
