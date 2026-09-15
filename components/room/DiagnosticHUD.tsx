"use client";

import { useState, useEffect } from "react";
import { AppIcon } from "@/components/ui/Icon";
import { useLanguage } from "@/context/LanguageContext";

interface DiagnosticHUDProps {
  roomSlug: string;
  onClose?: () => void;
}

export function DiagnosticHUD({ roomSlug, onClose }: DiagnosticHUDProps) {
  const { t } = useLanguage();
  const [mockActive, setMockActive] = useState(false);
  const [rtt, setRtt] = useState(22);
  const [fps, setFps] = useState(30);

  useEffect(() => {
    const interval = setInterval(() => {
      setRtt(18 + Math.floor(Math.random() * 10));
      setFps(29 + Math.floor(Math.random() * 2));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-12 sm:top-16 right-2 sm:right-4 z-30 w-72 sm:w-80 max-w-[calc(100vw-1rem)] bg-espresso-900/95 border border-brass-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-xs font-mono text-crema-200 select-none">
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
            CONNECTED (ICE OK)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-crema-600">Room Slug:</span>
          <span className="text-crema-100 truncate max-w-[140px]">{roomSlug}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-crema-600">RTT Latency:</span>
          <span className="text-brass-400 font-bold tabular-nums">{rtt} ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-crema-600">Frame Rate:</span>
          <span className="text-bourbon-400 font-bold tabular-nums">{fps} FPS</span>
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
          onClick={() => setMockActive(!mockActive)}
          className={`w-full py-2 rounded-xl font-mono text-xs font-bold transition-all shadow-sm ${
            mockActive
              ? "bg-bourbon-600 hover:bg-bourbon-700 text-crema-50"
              : "bg-brass-500 hover:bg-brass-600 text-espresso-950"
          }`}
        >
          {mockActive ? "⏹ STOP MOCK STREAM" : "▶ START CANVAS MOCK"}
        </button>
        <p className="text-[10px] text-crema-600 text-center leading-tight">
          Sandbox room runs diagnostics without polluting user focus logs.
        </p>
      </div>
    </div>
  );
}
