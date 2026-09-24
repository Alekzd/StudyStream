"use client";

import { useState, useEffect, useRef } from "react";
import { useMaybeRoomContext, useConnectionState } from "@livekit/components-react";
import { ConnectionQuality } from "livekit-client";
import { AppIcon } from "@/components/ui/Icon";
import { useLanguage } from "@/context/LanguageContext";
import { createMockVideoStream } from "@/lib/mockStream";

interface DiagnosticHUDProps {
  roomSlug: string;
  onClose?: () => void;
}

export function DiagnosticHUD({ roomSlug, onClose }: DiagnosticHUDProps) {
  const { t } = useLanguage();
  const room = useMaybeRoomContext();
  const connectionState = useConnectionState();

  const [rtt, setRtt] = useState<number | null>(null);
  const [fps, setFps] = useState<number | null>(null);
  const [quality, setQuality] = useState<string>("GOOD");
  const [mockActive, setMockActive] = useState(false);
  const mockStreamRef = useRef<{ stream: MediaStream; stop: () => void } | null>(null);

  useEffect(() => {
    if (!room) return;

    const updateStats = async () => {
      try {
        let foundRtt: number | null = null;
        let foundFps: number | null = null;

        // 1. Query WebRTC RTCPeerConnection statistics directly
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const engine = (room as any).engine;
        const pc: RTCPeerConnection | undefined =
          engine?.pcManager?.publisher?.pc || engine?.pcManager?.subscriber?.pc;

        if (pc && typeof pc.getStats === "function") {
          const stats = await pc.getStats();
          stats.forEach((report: { type: string; state?: string; currentRoundTripTime?: number; roundTripTime?: number; framesPerSecond?: number; kind?: string }) => {
            if (report.type === "candidate-pair" && report.state === "succeeded") {
              const trip = report.currentRoundTripTime ?? report.roundTripTime;
              if (trip !== undefined) {
                foundRtt = Math.round(trip * 1000);
              }
            }
            if ((report.type === "outbound-rtp" || report.type === "inbound-rtp") && report.kind === "video") {
              if (report.framesPerSecond !== undefined && report.framesPerSecond > 0) {
                foundFps = Math.round(report.framesPerSecond);
              }
            }
          });
        }

        // 2. Fallback to SignalClient RTT if peer connection candidate-pair stat not ready yet
        if (foundRtt === null && engine?.client?.rtt !== undefined && engine.client.rtt > 0) {
          foundRtt = engine.client.rtt;
        }

        // 3. Fallback FPS from local video track media settings
        if (foundFps === null) {
          const localTrackPub = Array.from(room.localParticipant.videoTrackPublications.values())[0];
          const mediaTrack = localTrackPub?.videoTrack?.mediaStreamTrack;
          const frameRate = mediaTrack?.getSettings()?.frameRate;
          if (frameRate) {
            foundFps = Math.round(frameRate);
          }
        }

        if (foundRtt !== null) setRtt(foundRtt);
        if (foundFps !== null) setFps(foundFps);

        // 4. Connection Quality status
        const q = room.localParticipant.connectionQuality;
        if (q === ConnectionQuality.Excellent) setQuality("EXCELLENT");
        else if (q === ConnectionQuality.Good) setQuality("GOOD");
        else if (q === ConnectionQuality.Poor) setQuality("POOR");
        else if (q === ConnectionQuality.Lost) setQuality("LOST");
      } catch (err) {
        console.error("DiagnosticHUD stats error:", err);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 1500);
    return () => clearInterval(interval);
  }, [room]);

  const handleToggleMock = () => {
    if (mockActive) {
      mockStreamRef.current?.stop();
      mockStreamRef.current = null;
      setMockActive(false);
    } else {
      const mock = createMockVideoStream("Sandbox Tester");
      mockStreamRef.current = mock;
      setMockActive(true);
    }
  };

  useEffect(() => {
    return () => {
      mockStreamRef.current?.stop();
    };
  }, []);

  const displayState = connectionState ? connectionState.toUpperCase() : "CONNECTED (ICE OK)";

  return (
    <div className="absolute top-12 sm:top-16 right-2 sm:right-4 z-30 w-72 sm:w-80 max-w-[calc(100vw-1rem)] bg-espresso-900/95 border border-brass-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-xs font-mono text-crema-200 select-none animate-pip-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-espresso-700/80">
        <div className="flex items-center gap-2 text-brass-400 font-bold tracking-tight">
          <AppIcon name="flask" size={16} />
          <span>{t("diagnostic_hud_title")}</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-crema-600 hover:text-crema-200 p-1 rounded transition-colors"
          >
            <AppIcon name="close" size={14} />
          </button>
        )}
      </div>

      {/* Metrics List */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-crema-600">Status:</span>
          <span className="text-patina-400 font-semibold flex items-center gap-1">
            {displayState}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-crema-600">Room Slug:</span>
          <span className="text-crema-100 truncate max-w-[140px]">{roomSlug}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-crema-600">RTT Latency:</span>
          <span className="text-brass-400 font-bold tabular-nums">
            {rtt !== null ? `${rtt} ms` : "-- ms"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-crema-600">Frame Rate:</span>
          <span className="text-bourbon-400 font-bold tabular-nums">
            {fps !== null ? `${fps} FPS` : "OFF"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-crema-600">Quality:</span>
          <span className="text-patina-400 font-semibold">{quality}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-crema-600">Adaptive Stream:</span>
          <span className="text-crema-400">180p @ 90Kbps</span>
        </div>
        <div className="flex justify-between">
          <span className="text-crema-600">Streak Data:</span>
          <span className="text-patina-400 font-bold">ISOLATED (Sandbox)</span>
        </div>
      </div>

      {/* Action Controls */}
      <div className="pt-2 border-t border-espresso-700/80 flex flex-col gap-2">
        <button
          onClick={handleToggleMock}
          className={`w-full py-2 rounded-xl font-mono text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
            mockActive
              ? "bg-bourbon-600 hover:bg-bourbon-700 text-crema-50"
              : "bg-brass-500 hover:bg-brass-600 text-espresso-950"
          }`}
        >
          <AppIcon name={mockActive ? "pause" : "play"} size={13} />
          <span>{mockActive ? "STOP MOCK STREAM" : "START CANVAS MOCK"}</span>
        </button>
        <p className="text-[10px] text-crema-600 text-center leading-tight">
          Sandbox room runs real WebRTC metrics without polluting user focus logs.
        </p>
      </div>
    </div>
  );
}
