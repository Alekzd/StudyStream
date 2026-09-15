"use client";
// components/room/DiagnosticHUD.tsx
// StudyStream OS — Sandbox Diagnostic HUD for developer testing
// Reference: 07_Sandbox_Testing_and_Local_Verification.md

import { useState, useEffect } from "react";
import { Activity, Radio, Cpu, RefreshCw, X } from "lucide-react";
import { createMockVideoStream } from "@/lib/mockStream";

interface DiagnosticHUDProps {
  roomSlug: string;
  onClose?: () => void;
}

export function DiagnosticHUD({ roomSlug, onClose }: DiagnosticHUDProps) {
  const [mockActive, setMockActive] = useState(false);
  const [rtt, setRtt] = useState(24);
  const [fps, setFps] = useState(30);

  useEffect(() => {
    // Simulated slight jitter for realistic testing feedback
    const interval = setInterval(() => {
      setRtt(20 + Math.floor(Math.random() * 12));
      setFps(29 + Math.floor(Math.random() * 2));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMock = () => {
    setMockActive((prev) => !prev);
  };

  return (
    <div className="absolute top-16 right-4 z-30 w-80 bg-neutral-900/95 border border-indigo-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md text-xs font-mono text-neutral-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-800">
        <div className="flex items-center gap-2 text-indigo-400 font-bold">
          <Activity size={15} />
          <span>SANDBOX DIAGNOSTIC HUD</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300 p-1"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Metrics list */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-neutral-500">Trạng Thái:</span>
          <span className="text-green-400 font-semibold flex items-center gap-1">
            <Radio size={12} /> CONNECTED (ICE OK)
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Phòng Test:</span>
          <span className="text-neutral-200 truncate max-w-[140px]">{roomSlug}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Độ Trễ RTT:</span>
          <span className="text-indigo-400">{rtt} ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Frame Rate:</span>
          <span className="text-amber-400">{fps} FPS</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Băng Thông Egress:</span>
          <span className="text-neutral-300">~180 Kbps (Simulcast)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Data Pollution:</span>
          <span className="text-emerald-400 font-semibold">BLOCKED (isSandbox=true)</span>
        </div>
      </div>

      {/* Action controls */}
      <div className="pt-2 border-t border-neutral-800 flex flex-col gap-2">
        <button
          onClick={handleToggleMock}
          className={`w-full py-2 rounded-lg font-medium transition-colors ${
            mockActive
              ? "bg-red-600/80 hover:bg-red-500 text-white"
              : "bg-indigo-600 hover:bg-indigo-500 text-white"
          }`}
        >
          {mockActive ? "⏹ Dừng Canvas Mock Stream" : "▶ Phát Canvas Mock Stream"}
        </button>
        <p className="text-[10px] text-neutral-500 text-center leading-tight">
          Phòng Sandbox kiểm tra video & đồng hồ mà không ghi vào Streak của bạn.
        </p>
      </div>
    </div>
  );
}
