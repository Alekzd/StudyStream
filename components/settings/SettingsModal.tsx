"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { usePathname } from "next/navigation";
import { AppIcon } from "@/components/ui/Icon";
import { cn, cleanTitle, getServerIcon } from "@/lib/utils";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/context/LanguageContext";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "region" | "preferences" | "language";
  onRegionChange?: (serverId: string | "ALL") => void;
}

export function SettingsModal({
  open,
  onClose,
  defaultTab = "region",
  onRegionChange,
}: SettingsModalProps) {
  const { language } = useLanguage();
  const isVi = language === "vi";
  const pathname = usePathname();
  const updateRoomCadence = useMutation(api.rooms.updateRoomCadence);

  const regionalServers = useQuery(api.servers.getRegionalServers);
  const [activeTab, setActiveTab] = useState<"region" | "preferences" | "language">(defaultTab);
  const [saveCadenceNotice, setSaveCadenceNotice] = useState<string | null>(null);

  const [selectedServerId, setSelectedServerId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("studystream_active_server_id") || "ALL";
    }
    return "ALL";
  });

  const handleSelectServer = (id: string) => {
    setSelectedServerId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("studystream_active_server_id", id);
    }
    if (onRegionChange) onRegionChange(id);
  };

  const [selectedCadence, setSelectedCadence] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("studystream_default_cadence") || "50/10";
    }
    return "50/10";
  });

  const handleSelectCadence = async (cadenceVal: string) => {
    setSelectedCadence(cadenceVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("studystream_default_cadence", cadenceVal);
      window.dispatchEvent(new CustomEvent("studystream_cadence_changed", { detail: cadenceVal }));
    }

    // If currently inside a room, update the active room's cadence immediately
    const roomMatch = pathname?.match(/\/rooms\/([a-zA-Z0-9_]+)/);
    if (roomMatch && roomMatch[1]) {
      try {
        await updateRoomCadence({
          roomId: roomMatch[1] as Id<"rooms">,
          cadence: cadenceVal,
        });
      } catch {}
    }

    setSaveCadenceNotice(cadenceVal);
    setTimeout(() => setSaveCadenceNotice(null), 3000);
  };

  if (!open) return null;

  // Filter out any legacy servers if necessary, keep regional ones
  const validServers = regionalServers?.filter(
    (s) => s.slug === "vietnam" || s.slug === "global" || s.slug === "japan-korea" || s.slug === "north-america" || s.slug === "europe"
  ) ?? regionalServers;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Crisp Dark Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 transition-opacity"
        onClick={onClose}
      />

      {/* Settings Dialog Card */}
      <div className="relative bg-espresso-900 rounded-2xl w-full max-w-xl border border-espresso-750 shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden text-crema-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-espresso-750/80 bg-espresso-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-espresso-850 border border-espresso-700 flex items-center justify-center text-brass-400">
              <AppIcon name="settings" size={17} />
            </div>
            <div>
              <h2 className="text-base font-bold text-crema-100 font-sans tracking-tight">
                {isVi ? "Cài Đặt" : "Settings"}
              </h2>
              <p className="text-[11px] font-mono text-crema-400">
                {isVi ? "Máy chủ khu vực và ngôn ngữ." : "Server region and language."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-crema-600 hover:text-crema-200 hover:bg-espresso-800 transition-colors"
            aria-label="Close settings"
          >
            <AppIcon name="close" size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-espresso-750/60 bg-espresso-900/40 px-5 shrink-0 text-xs font-medium">
          <button
            onClick={() => setActiveTab("region")}
            className={cn(
              "py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5",
              activeTab === "region"
                ? "border-brass-400 text-brass-300 font-semibold"
                : "border-transparent text-crema-400 hover:text-crema-200"
            )}
          >
            <AppIcon name="globe" size={14} />
            <span>{isVi ? "Máy Chủ" : "Server"}</span>
          </button>

          <button
            onClick={() => setActiveTab("preferences")}
            className={cn(
              "py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5",
              activeTab === "preferences"
                ? "border-brass-400 text-brass-300 font-semibold"
                : "border-transparent text-crema-400 hover:text-crema-200"
            )}
          >
            <AppIcon name="sliders" size={14} />
            <span>{isVi ? "Nhịp Pomo Mặc Định" : "Default Cadence"}</span>
          </button>

          <button
            onClick={() => setActiveTab("language")}
            className={cn(
              "py-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5",
              activeTab === "language"
                ? "border-brass-400 text-brass-300 font-semibold"
                : "border-transparent text-crema-400 hover:text-crema-200"
            )}
          >
            <AppIcon name="message" size={14} />
            <span>{isVi ? "Ngôn Ngữ" : "Language"}</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: REGIONAL STUDY SERVERS */}
          {activeTab === "region" && (
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-crema-400 mb-1">
                  Active Regional Server
                </h3>
                <p className="text-xs text-crema-400 leading-relaxed">
                  Switching country servers connects you to local or international study rooms matching your preferred timezone.
                </p>
              </div>

              {/* "All Regions" Card */}
              <button
                type="button"
                onClick={() => handleSelectServer("ALL")}
                className={cn(
                  "flex items-center justify-between w-full p-3 rounded-xl border text-left transition-all",
                  selectedServerId === "ALL"
                    ? "bg-espresso-800 border-brass-500/60 shadow-sm"
                    : "bg-espresso-850/60 border-espresso-750/70 hover:bg-espresso-800/60"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-espresso-750 border border-espresso-700 flex items-center justify-center text-brass-400 shrink-0">
                    <AppIcon name="globe" size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-crema-100 font-sans">
                      All Study Regions (Global View)
                    </div>
                    <div className="text-[11px] text-crema-400">
                      Display all public workstations across all countries
                    </div>
                  </div>
                </div>
                {selectedServerId === "ALL" && (
                  <span className="text-[11px] font-mono font-bold text-brass-400 bg-brass-500/15 px-2 py-0.5 rounded">
                    Active
                  </span>
                )}
              </button>

              {/* Country Server Cards */}
              <div className="grid grid-cols-1 gap-2 pt-1">
                {validServers?.map((server) => {
                  const isSelected = selectedServerId === server._id;

                  return (
                    <button
                      key={server._id}
                      type="button"
                      onClick={() => handleSelectServer(server._id)}
                      className={cn(
                        "flex items-center justify-between w-full p-3 rounded-xl border text-left transition-all",
                        isSelected
                          ? "bg-espresso-800 border-brass-500/60 shadow-sm"
                          : "bg-espresso-850/60 border-espresso-750/70 hover:bg-espresso-800/60"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-espresso-750 border border-espresso-700 flex items-center justify-center text-brass-400 shrink-0">
                          <AppIcon name={getServerIcon(server.slug)} size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm text-crema-100 font-sans truncate">
                            {cleanTitle(server.name)}
                          </div>
                          <div className="text-[11px] text-crema-400 truncate">
                            {server.description}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-[11px] font-mono font-bold text-brass-400 bg-brass-500/15 px-2 py-0.5 rounded shrink-0 ml-2">
                          Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: STUDY PREFERENCES */}
          {activeTab === "preferences" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-crema-400 mb-1">
                  {isVi ? "Nhịp Pomodoro Mặc Định" : "Default Pomodoro Cadence"}
                </h3>
                <p className="text-xs text-crema-400 mb-3 leading-relaxed">
                  {isVi
                    ? "Nhịp đếm tự động áp dụng khi tạo phòng mới hoặc khởi tạo đồng hồ."
                    : "Recommended cadence for maximum cognitive retention. Automatically applied when creating rooms."}
                </p>

                {saveCadenceNotice && (
                  <div className="mb-3 p-2.5 rounded-xl bg-patina-500/15 border border-patina-500/40 text-patina-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
                    <AppIcon name="check" size={14} className="text-patina-400 shrink-0" />
                    <span>
                      {isVi
                        ? `✓ Đã lưu & áp dụng nhịp ${saveCadenceNotice} cho các phòng và phiên học!`
                        : `✓ Saved & applied ${saveCadenceNotice} cadence to active sessions!`}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "50/10",
                      title: "50 / 10",
                      nameEn: "Standard Deep Work",
                      nameVi: "Tập Trung Tiêu Chuẩn",
                      descEn: "50m work • 10m break",
                      descVi: "50p học • 10p nghỉ",
                    },
                    {
                      id: "25/5",
                      title: "25 / 5",
                      nameEn: "Classic Pomodoro",
                      nameVi: "Pomodoro Cổ Điển",
                      descEn: "25m work • 5m break",
                      descVi: "25p học • 5p nghỉ",
                    },
                    {
                      id: "90/20",
                      title: "90 / 20",
                      nameEn: "Ultradian Cycle",
                      nameVi: "Chu Kỳ Sâu Ultradian",
                      descEn: "90m work • 20m break",
                      descVi: "90p học • 20p nghỉ",
                    },
                  ].map((cad) => {
                    const isSelected = selectedCadence === cad.id;
                    return (
                      <button
                        key={cad.id}
                        type="button"
                        onClick={() => handleSelectCadence(cad.id)}
                        className={cn(
                          "flex flex-col items-center justify-between p-3 rounded-xl border text-center transition-all cursor-pointer group",
                          isSelected
                            ? "bg-espresso-800 border-brass-500 shadow-sm ring-1 ring-brass-500/50"
                            : "bg-espresso-850/60 border-espresso-750/70 hover:bg-espresso-800/60 hover:border-espresso-700"
                        )}
                      >
                        <div className="w-full">
                          <div className={cn("font-bold text-sm", isSelected ? "text-brass-300" : "text-crema-100")}>
                            {cad.title}
                          </div>
                          <div className="text-[11px] font-semibold text-crema-300 mt-1">
                            {isVi ? cad.nameVi : cad.nameEn}
                          </div>
                          <div className="text-[10px] text-crema-500 font-mono mt-0.5">
                            {isVi ? cad.descVi : cad.descEn}
                          </div>
                        </div>

                        {isSelected ? (
                          <span className="mt-3 text-[10px] font-mono font-bold text-brass-400 bg-brass-500/15 px-2 py-0.5 rounded">
                            {isVi ? "Đang chọn" : "Active"}
                          </span>
                        ) : (
                          <span className="mt-3 text-[10px] font-mono text-crema-600 group-hover:text-crema-400">
                            {isVi ? "Chọn" : "Select"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LANGUAGE */}
          {activeTab === "language" && (
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-crema-400 mb-1">
                  {isVi ? "Ngôn Ngữ Giao Diện" : "Interface Language"}
                </h3>
                <p className="text-xs text-crema-400 mb-3">
                  {isVi ? "Chọn tiếng Việt hoặc English." : "Select Vietnamese or English."}
                </p>
                <div className="pt-2">
                  <LanguageToggle />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-espresso-750/80 bg-espresso-900 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-brass-500 hover:bg-brass-600 text-espresso-950 font-bold text-xs font-sans rounded-xl transition-all shadow-sm"
          >
            {isVi ? "Hoàn Tất" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
