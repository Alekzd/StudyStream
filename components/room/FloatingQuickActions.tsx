"use client";

import React, { useState, useEffect } from "react";
import { useLocalParticipant } from "@livekit/components-react";
import { AppIcon } from "@/components/ui/Icon";
import { AmbientAudioDock } from "@/components/soundscape/AmbientAudioDock";
import { soundscape } from "@/lib/soundscape";
import { cn } from "@/lib/utils";

export type GridLayoutType = "auto" | "2x2" | "3x3" | "4x4";

interface FloatingQuickActionsProps {
  isChatOpen?: boolean;
  onToggleChat?: () => void;
  isSilentRoom?: boolean;
  canScreenShare?: boolean;
  gridLayout?: GridLayoutType;
  onSelectGridLayout?: (layout: GridLayoutType) => void;
  onLeaveRoom?: () => void;
  isSoundOpen?: boolean;
  onToggleSound?: () => void;
}

const GRID_OPTIONS: { id: GridLayoutType; label: string; desc: string }[] = [
  { id: "auto", label: "Auto", desc: "Adaptive dynamic grid" },
  { id: "2x2", label: "2 × 2", desc: "4 focus tiles" },
  { id: "3x3", label: "3 × 3", desc: "9 scholar tiles" },
  { id: "4x4", label: "4 × 4", desc: "16 wide campus tiles" },
];

export function FloatingQuickActions({
  isChatOpen = false,
  onToggleChat,
  isSilentRoom = false,
  canScreenShare = false,
  gridLayout = "auto",
  onSelectGridLayout,
  onLeaveRoom,
  isSoundOpen,
  onToggleSound,
}: FloatingQuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);
  const [isLocalAudioOpen, setIsLocalAudioOpen] = useState(false);
  const [isAudioActive, setIsAudioActive] = useState(false);

  // Free-form Dragging State (iOS AssistiveTouch / floating bubble style)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const dragInfoRef = React.useRef<{
    startX: number;
    startY: number;
    elemStartX: number;
    elemStartY: number;
    hasMoved: boolean;
  } | null>(null);

  const handleDragStart = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    dragInfoRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      elemStartX: rect.left,
      elemStartY: rect.top,
      hasMoved: false,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!dragInfoRef.current) return;
    const dx = e.clientX - dragInfoRef.current.startX;
    const dy = e.clientY - dragInfoRef.current.startY;
    if (Math.hypot(dx, dy) > 6) {
      dragInfoRef.current.hasMoved = true;
    }
    if (!dragInfoRef.current.hasMoved) return;

    const container = containerRef.current;
    const elemWidth = container?.offsetWidth || 50;
    const elemHeight = container?.offsetHeight || 50;

    const margin = 8;
    const minX = margin;
    const maxX = Math.max(minX, window.innerWidth - elemWidth - margin);
    const minY = margin;
    const maxY = Math.max(minY, window.innerHeight - elemHeight - margin);

    const nextX = Math.min(Math.max(minX, dragInfoRef.current.elemStartX + dx), maxX);
    const nextY = Math.min(Math.max(minY, dragInfoRef.current.elemStartY + dy), maxY);

    setPosition({ x: nextX, y: nextY });
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setTimeout(() => {
      if (dragInfoRef.current) {
        dragInfoRef.current = null;
      }
    }, 60);
  };

  const audioOpen = isSoundOpen !== undefined ? isSoundOpen : isLocalAudioOpen;

  useEffect(() => {
    const checkAudio = () => {
      setIsAudioActive(soundscape.isPlayingAny());
    };
    checkAudio();
    const unsub = soundscape.subscribe(checkAudio);
    return unsub;
  }, []);

  const handleToggleSound = () => {
    if (onToggleSound) {
      onToggleSound();
    } else {
      setIsLocalAudioOpen((v) => !v);
    }
  };

  const { isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled, localParticipant } =
    useLocalParticipant();

  const handleToggleMic = async () => {
    if (isSilentRoom) return;
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
    } catch (err) {
      console.error("Failed to toggle microphone:", err);
    }
  };

  const handleToggleCam = async () => {
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (err) {
      console.error("Failed to toggle camera:", err);
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled);
    } catch (err) {
      console.error("Failed to toggle screenshare:", err);
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute z-40 select-none flex flex-col pointer-events-none"
      style={
        position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
              bottom: "auto",
              transform: "none",
              alignItems: isExpanded ? "center" : "flex-start",
            }
          : {
              bottom: "max(2rem, calc(env(safe-area-inset-bottom) + 1rem))",
              left: isExpanded ? "50%" : "1rem",
              transform: isExpanded ? "translateX(-50%)" : "translateX(0)",
              alignItems: isExpanded ? "center" : "flex-start",
            }
      }
      aria-label="Floating Quick Actions"
    >
      {/* ─── Ambient Audio Floating Card (Image 4 Dock) ─── */}
      {isExpanded && audioOpen && (
        <div className="mb-2.5 animate-pip-in pointer-events-auto">
          <AmbientAudioDock
            onClose={() => {
              if (onToggleSound) onToggleSound();
              else setIsLocalAudioOpen(false);
            }}
          />
        </div>
      )}

      {/* ─── Grid Selection Popover (Floats above the bar) ─── */}
      {isExpanded && isGridMenuOpen && onSelectGridLayout && (
        <div className="mb-2.5 p-2 rounded-2xl bg-espresso-900/95 border border-brass-500/50 shadow-2xl backdrop-blur-md flex gap-1.5 animate-pip-in duration-200 pointer-events-auto">
          {GRID_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onSelectGridLayout(opt.id);
                setIsGridMenuOpen(false);
              }}
              className={cn(
                "px-2.5 py-1.5 rounded-xl text-xs font-mono font-semibold transition-all flex flex-col items-center gap-0.5 cursor-pointer hover-spring",
                gridLayout === opt.id
                  ? "bg-brass-500 text-espresso-950 shadow-sm"
                  : "bg-espresso-850 text-crema-300 hover:bg-espresso-800 hover:text-crema-100 border border-espresso-700/80"
              )}
              title={opt.desc}
            >
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}

      {!isExpanded ? (
        /* ─── Collapsed State: Compact Round Badge — draggable anywhere ─── */
        <button
          type="button"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onClick={() => {
            if (dragInfoRef.current?.hasMoved) return;
            setIsExpanded(true);
          }}
          className={cn(
            "pointer-events-auto relative w-12 h-12 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-md cursor-grab active:cursor-grabbing group animate-pop-in overflow-hidden touch-none",
            "bg-espresso-900/90 border border-brass-500/50 hover:border-brass-400 hover:scale-105 active:scale-95 transition-transform",
            isMicrophoneEnabled ? "ring-2 ring-patina-500/30" : "ring-1 ring-bourbon-500/30"
          )}
          title="Kéo vòng quanh để di chuyển • Nhấp để mở"
          aria-label="Expand quick action bar"
        >
          {/* Main Icon */}
          <AppIcon
            name="sliders"
            size={20}
            className="text-brass-400 group-hover:text-brass-300 transition-colors pointer-events-none"
          />

          {/* Mic status dot — top-right corner, inset inside overflow-hidden */}
          <span
            className={cn(
              "absolute top-1 right-1 w-2 h-2 rounded-full transition-colors pointer-events-none",
              isSilentRoom
                ? "bg-espresso-600"
                : isMicrophoneEnabled
                ? "bg-patina-400"
                : "bg-bourbon-500"
            )}
          />

          {/* Cam status dot — bottom-right corner */}
          <span
            className={cn(
              "absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full transition-colors pointer-events-none",
              isCameraEnabled
                ? "bg-patina-400"
                : "bg-espresso-700"
            )}
          />

          {/* Audio active dot — top-left */}
          {isAudioActive && (
            <span
              className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-brass-400 animate-pulse pointer-events-none"
              title="Ambient audio playing"
            />
          )}
        </button>
      ) : (
        /* ─── Expanded State: Centered Retractable Action Bar ─── */
        <div
          className={cn(
            "pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full shadow-2xl backdrop-blur-md transition-all duration-300 animate-pop-in",
            "bg-espresso-900/95 border border-brass-500/60 ring-1 ring-brass-500/20"
          )}
        >
          {/* 0. Drag Grip Handle for expanded bar */}
          <div
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            className="flex items-center justify-center w-5 h-9 -ml-0.5 text-crema-600 hover:text-brass-400 cursor-grab active:cursor-grabbing touch-none select-none transition-colors"
            title="Kéo thanh công cụ (Drag toolbar)"
            aria-label="Drag toolbar"
          >
            <div className="flex flex-col gap-0.5 items-center pointer-events-none">
              <div className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-crema-600" />
                <span className="w-1 h-1 rounded-full bg-crema-600" />
              </div>
              <div className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-crema-600" />
                <span className="w-1 h-1 rounded-full bg-crema-600" />
              </div>
              <div className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-crema-600" />
                <span className="w-1 h-1 rounded-full bg-crema-600" />
              </div>
            </div>
          </div>
          {/* 1. Mute / Unmute Mic Button */}
          <button
            type="button"
            onClick={handleToggleMic}
            disabled={isSilentRoom}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer hover-spring",
              isSilentRoom
                ? "bg-espresso-800 text-crema-600 cursor-not-allowed border border-espresso-750"
                : isMicrophoneEnabled
                ? "bg-patina-500/20 text-patina-300 border border-patina-500/60 hover:bg-patina-500/30 shadow-sm"
                : "bg-bourbon-500/20 text-bourbon-400 border border-bourbon-500/50 hover:bg-bourbon-500/30 shadow-sm"
            )}
            title={
              isSilentRoom
                ? "Silent Room: Mic locked"
                : isMicrophoneEnabled
                ? "Mute Microphone"
                : "Unmute Microphone"
            }
            aria-label={isMicrophoneEnabled ? "Mute Microphone" : "Unmute Microphone"}
          >
            <AppIcon
              name={isMicrophoneEnabled ? "micOn" : "micOff"}
              size={18}
              className={isMicrophoneEnabled ? "text-patina-400" : "text-bourbon-400"}
            />
          </button>

          {/* 2. Cam / Video On/Off Button */}
          <button
            type="button"
            onClick={handleToggleCam}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer hover-spring",
              isCameraEnabled
                ? "bg-patina-500/20 text-patina-300 border border-patina-500/60 hover:bg-patina-500/30 shadow-sm"
                : "bg-espresso-800 text-crema-400 border border-espresso-700 hover:text-crema-100 hover:bg-espresso-750"
            )}
            title={isCameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
            aria-label={isCameraEnabled ? "Turn Off Camera" : "Turn On Camera"}
          >
            <AppIcon
              name={isCameraEnabled ? "videoOn" : "videoOff"}
              size={18}
              className={isCameraEnabled ? "text-patina-400" : "text-crema-400"}
            />
          </button>

          {/* 3. Ambient Audio Soundscape Toggle Button */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer hover-spring",
              audioOpen || isAudioActive
                ? "bg-brass-500/20 text-brass-300 border border-brass-500/60 shadow-sm"
                : "bg-espresso-800 text-crema-400 border border-espresso-700 hover:text-crema-100 hover:bg-espresso-750"
            )}
            title="Ambient Audio Soundscape (Coffee, Rain, Jazz, Fire)"
            aria-label="Toggle Ambient Audio Soundscape"
          >
            <AppIcon
              name="headphones"
              size={18}
              className={audioOpen || isAudioActive ? "text-brass-400" : "text-crema-400"}
            />
          </button>

          {/* 4. Grid Layout Selector Button (2x2, 3x3, 4x4, Auto) */}
          {onSelectGridLayout && (
            <button
              type="button"
              onClick={() => setIsGridMenuOpen((v) => !v)}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer hover-spring",
                isGridMenuOpen || gridLayout !== "auto"
                  ? "bg-brass-500/20 text-brass-300 border border-brass-500/60 shadow-sm"
                  : "bg-espresso-800 text-crema-400 border border-espresso-700 hover:text-crema-100 hover:bg-espresso-750"
              )}
              title={`Grid Layout (${gridLayout.toUpperCase()}) — Click to change 2x2, 3x3, 4x4`}
              aria-label="Select Video Grid Layout"
            >
              <AppIcon name="grid" size={17} />
            </button>
          )}

          {/* 5. Screen Share Button (if applicable) */}
          {canScreenShare && (
            <button
              type="button"
              onClick={handleToggleScreenShare}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer hover-spring",
                isScreenShareEnabled
                  ? "bg-brass-500/20 text-brass-300 border border-brass-500/60 hover:bg-brass-500/30 shadow-sm"
                  : "bg-espresso-800 text-crema-400 border border-espresso-700 hover:text-crema-100 hover:bg-espresso-750"
              )}
              title={isScreenShareEnabled ? "Stop Sharing Screen" : "Share Screen"}
              aria-label={isScreenShareEnabled ? "Stop Sharing Screen" : "Share Screen"}
            >
              <AppIcon name="screenShare" size={18} />
            </button>
          )}

          {/* 6. Chat Drawer Toggle Button */}
          {onToggleChat && (
            <button
              type="button"
              onClick={onToggleChat}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer hover-spring",
                isChatOpen
                  ? "bg-brass-500 text-espresso-950 font-bold shadow-md"
                  : "bg-espresso-800 text-crema-300 border border-espresso-700 hover:text-crema-100 hover:bg-espresso-750"
              )}
              title={isChatOpen ? "Close Chat Drawer" : "Open Chat Drawer"}
              aria-label={isChatOpen ? "Close Chat Drawer" : "Open Chat Drawer"}
            >
              <AppIcon name="chat" size={18} />
            </button>
          )}

          {/* 7. Exit Room Button (Orange door with exit arrow, matching image 2) */}
          {onLeaveRoom && (
            <>
              <div className="w-[1px] h-5 bg-espresso-700/80 mx-0.5" />
              <button
                type="button"
                onClick={onLeaveRoom}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer bg-bourbon-500/20 text-bourbon-400 border border-bourbon-500/50 hover:bg-bourbon-500/30 hover:border-bourbon-400 hover:text-bourbon-300 shadow-sm hover-spring"
                title="Rời phòng / Exit Room"
                aria-label="Rời phòng / Exit Room"
              >
                <AppIcon name="logout" size={18} className="text-bourbon-400" />
              </button>
            </>
          )}

          {/* 8. Retract / Minimize Button */}
          <button
            type="button"
            onClick={() => {
              setIsExpanded(false);
              setIsGridMenuOpen(false);
              setIsLocalAudioOpen(false);
            }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-crema-500 hover:text-crema-200 hover:bg-espresso-800 transition-colors ml-0.5 cursor-pointer"
            title="Retract to floating badge"
            aria-label="Retract action bar"
          >
            <AppIcon name="close" size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
