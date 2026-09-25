"use client";

import { useState, useCallback, useEffect } from "react";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
  FocusLayout,
  FocusLayoutContainer,
  CarouselLayout,
  LayoutContextProvider,
  usePinnedTracks,
  useCreateLayoutContext,
  useTrackRefContext,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { FloatingQuickActions, type GridLayoutType } from "./FloatingQuickActions";
import { DiagnosticHUD } from "./DiagnosticHUD";
import { AppIcon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const LS_GRID_KEY = "studystream_grid_layout";
const DEFAULT_GRID: GridLayoutType = "3x3";

function readSavedGrid(): GridLayoutType {
  if (typeof window === "undefined") return DEFAULT_GRID;
  try {
    const saved = localStorage.getItem(LS_GRID_KEY);
    if (saved === "auto" || saved === "2x2" || saved === "3x3" || saved === "4x4") {
      return saved as GridLayoutType;
    }
  } catch {}
  return DEFAULT_GRID;
}

interface StudyVideoGridProps {
  roomId?: Id<"rooms">;
  serverUrl: string;
  token: string;
  roomArchetype: string;
  isSensoryFriendly?: boolean;
  isChatOpen?: boolean;
  onToggleChat?: () => void;
  isSoundOpen?: boolean;
  onToggleSound?: () => void;
  showDiagnosticHUD?: boolean;
  onCloseDiagnosticHUD?: () => void;
  roomSlug?: string;
  onLeaveRoom?: () => void;
}

export function StudyVideoGrid({
  roomId,
  serverUrl,
  token,
  roomArchetype,
  isSensoryFriendly = false,
  isChatOpen = false,
  onToggleChat,
  isSoundOpen,
  onToggleSound,
  showDiagnosticHUD = false,
  onCloseDiagnosticHUD,
  roomSlug = "workstation",
  onLeaveRoom,
}: StudyVideoGridProps) {
  const isSilentRoom = roomArchetype === "SILENT_FOCUS";

  const participants = useQuery(
    api.rooms.getRoomParticipants,
    roomId ? { roomId } : "skip"
  );

  const intentionsMap = new Map<string, string>();
  participants?.forEach((p) => {
    if (p.currentIntention) {
      if (p.liveKitIdentity) intentionsMap.set(p.liveKitIdentity, p.currentIntention);
      if (p.user?.name) intentionsMap.set(p.user.name, p.currentIntention);
      if (p.userId) intentionsMap.set(p.userId, p.currentIntention);
    }
  });

  const [gridLayout, setGridLayout] = useState<GridLayoutType>(readSavedGrid);

  const handleSelectGrid = useCallback((layout: GridLayoutType) => {
    setGridLayout(layout);
    try {
      localStorage.setItem(LS_GRID_KEY, layout);
    } catch {}
  }, []);

  // Create a LayoutContext so pin state is shared between grid + quick actions
  const layoutContext = useCreateLayoutContext();

  return (
    <LayoutContextProvider value={layoutContext}>
      <LiveKitRoom
        video={true}
        audio={!isSilentRoom}
        token={token}
        serverUrl={serverUrl}
        connect={true}
        data-lk-theme="default"
        className="h-full w-full relative overflow-hidden"
        style={{
          "--lk-bg": "#0c0a09",
          "--lk-border-color": "#2b231e",
        } as React.CSSProperties}
      >
        <VideoGridInner
          isSensoryFriendly={isSensoryFriendly}
          gridLayout={gridLayout}
          intentionsMap={intentionsMap}
        />
        <RoomAudioRenderer />
        <FloatingQuickActions
          isChatOpen={isChatOpen}
          onToggleChat={onToggleChat}
          isSilentRoom={isSilentRoom}
          canScreenShare={roomArchetype === "PAIR_SCREENSHARE"}
          gridLayout={gridLayout}
          onSelectGridLayout={handleSelectGrid}
          onLeaveRoom={onLeaveRoom}
          isSoundOpen={isSoundOpen}
          onToggleSound={onToggleSound}
        />
        {showDiagnosticHUD && (
          <DiagnosticHUD
            roomSlug={roomSlug}
            onClose={onCloseDiagnosticHUD}
          />
        )}
      </LiveKitRoom>
    </LayoutContextProvider>
  );
}

function VideoGridInner({
  isSensoryFriendly,
  gridLayout,
  intentionsMap,
}: {
  isSensoryFriendly: boolean;
  gridLayout: GridLayoutType;
  intentionsMap: Map<string, string>;
}) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  const pinnedTracks = usePinnedTracks();
  const hasPinned = pinnedTracks && pinnedTracks.length > 0;

  const customGridStyles: React.CSSProperties = {
    height: "100%",
    ...(gridLayout === "2x2"
      ? { gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gridTemplateRows: "repeat(2, minmax(0, 1fr))" }
      : gridLayout === "3x3"
      ? { gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gridTemplateRows: "repeat(3, minmax(0, 1fr))" }
      : gridLayout === "4x4"
      ? { gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gridTemplateRows: "repeat(4, minmax(0, 1fr))" }
      : {}),
  };

  if (hasPinned) {
    return (
      <div className="h-full flex flex-col overflow-hidden p-2 gap-2">
        {/* Pinned badge hint */}
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-espresso-900/90 border border-brass-500/50 text-xs font-mono text-brass-300 pointer-events-none animate-pip-in shadow-lg backdrop-blur-sm">
          <AppIcon name="pin" size={12} className="text-brass-400" />
          <span>Đang ghim — nhấp đúp để bỏ ghim</span>
        </div>

        <FocusLayoutContainer className="flex-1 overflow-hidden">
          <FocusLayout
            trackRef={pinnedTracks[0]}
            style={{ filter: isSensoryFriendly ? "brightness(0.85) saturate(0.9)" : undefined }}
          />
          {/* Carousel strip of remaining participants */}
          <CarouselLayout
            tracks={tracks}
            orientation="vertical"
            className="w-28 shrink-0"
          >
            <ParticipantTile
              style={{ filter: isSensoryFriendly ? "brightness(0.85) saturate(0.9)" : undefined }}
            />
          </CarouselLayout>
        </FocusLayoutContainer>
      </div>
    );
  }

  return (
    <div className="h-full p-3 overflow-hidden relative">
      <GridLayout tracks={tracks} style={customGridStyles}>
        <PinnableTile isSensoryFriendly={isSensoryFriendly} intentionsMap={intentionsMap} />
      </GridLayout>
      {/* Grid layout indicator badge */}
      <GridBadge gridLayout={gridLayout} />
    </div>
  );
}

/** Tile that supports double-click to pin and displays study goal badge */
function PinnableTile({
  isSensoryFriendly,
  intentionsMap,
}: {
  isSensoryFriendly: boolean;
  intentionsMap: Map<string, string>;
}) {
  const trackRef = useTrackRefContext();
  const identity = trackRef?.participant?.identity;
  const participantName = trackRef?.participant?.name;
  const intention = identity
    ? intentionsMap.get(identity) || (participantName ? intentionsMap.get(participantName) : undefined)
    : undefined;

  return (
    <div className="relative group w-full h-full">
      <ParticipantTile
        style={{
          filter: isSensoryFriendly ? "brightness(0.85) saturate(0.9)" : undefined,
        }}
      />
      {/* Study Goal Badge on Tile */}
      {intention && (
        <div className="absolute top-2 left-2 z-10 max-w-[85%] pointer-events-none animate-pip-in">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-espresso-950/85 border border-brass-500/40 text-[10px] font-mono text-brass-300 shadow-md backdrop-blur-sm truncate">
            <AppIcon name="target" size={12} className="shrink-0 text-brass-400" />
            <span className="truncate">{intention}</span>
          </span>
        </div>
      )}
      {/* Double-click pin overlay hint (appears on hover) */}
      <div
        className={cn(
          "absolute bottom-1 right-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
        )}
      >
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-espresso-900/80 text-[9px] font-mono text-brass-400 border border-espresso-700/80 backdrop-blur-sm">
          <AppIcon name="pin" size={9} />
          <span>Nhấp đúp để ghim</span>
        </span>
      </div>
    </div>
  );
}

/** Small grid size badge in the corner */
function GridBadge({ gridLayout }: { gridLayout: GridLayoutType }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = setTimeout(() => setVisible(true), 0);
    const hide = setTimeout(() => setVisible(false), 2000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [gridLayout]);

  if (!visible) return null;

  return (
    <div className="absolute top-3 right-3 z-10 pointer-events-none animate-pip-in">
      <span className="px-2 py-1 rounded-lg bg-espresso-900/90 border border-brass-500/40 text-[10px] font-mono text-brass-300 backdrop-blur-sm shadow">
        {gridLayout === "auto" ? "Auto" : gridLayout.toUpperCase()} Grid
      </span>
    </div>
  );
}
