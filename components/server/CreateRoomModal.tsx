"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { AppIcon } from "@/components/ui/Icon";
import { useLanguage } from "@/context/LanguageContext";

const ARCHETYPES = [
  { value: "SILENT_FOCUS", label: "🤫 Im Lặng Tuyệt Đối", desc: "Camera on, micro tắt cưỡng chế. Body doubling thuần túy." },
  { value: "CAM_ACCOUNTABILITY", label: "📹 Cam-On Accountability", desc: "Bắt buộc bật webcam. Tắt 3 phút tự chuyển sang Spectator." },
  { value: "SYNC_POMODORO", label: "⏱️ Pomodoro Đồng Bộ", desc: "Cả phòng cùng làm việc, cùng nghỉ theo đồng hồ máy chủ." },
  { value: "AMBIENT_LOFI", label: "☕ Espresso & Vinyl Jazz", desc: "Âm thanh máy pha cà phê, đĩa than jazz xoay nhẹ. Tập trung sâu." },
  { value: "PAIR_SCREENSHARE", label: "💻 Pair Work & Screenshare", desc: "Chia sẻ màn hình 1080p cho cặp lập trình / bài tập nhóm." },
  { value: "SANDBOX_TEST", label: "🧪 Sandbox Testing", desc: "Test camera/mic/kết nối. Không tính vào streak." },
] as const;

type Archetype = typeof ARCHETYPES[number]["value"];

interface CreateRoomModalProps {
  serverId: Id<"servers">;
  categoryId?: Id<"roomCategories">;
  children?: React.ReactNode;
}

export function CreateRoomModal({ serverId, categoryId, children }: CreateRoomModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [archetype, setArchetype] = useState<Archetype>("SILENT_FOCUS");
  const [maxParticipants, setMaxParticipants] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createRoom = useMutation(api.rooms.createRoom);
  const { language } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");
    try {
      await createRoom({
        serverId,
        categoryId,
        name: name.trim(),
        archetype,
        maxParticipants,
      });
      setOpen(false);
      setName("");
    } catch (err: any) {
      setError(err.message ?? "Đã xảy ra lỗi.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <span onClick={() => setOpen(true)} style={{ cursor: "pointer" }}>
        {children}
      </span>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative bg-espresso-900 rounded-2xl p-6 w-full max-w-lg border border-espresso-700 shadow-2xl max-h-[90vh] overflow-y-auto z-10 select-none">
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-crema-600 hover:text-crema-200 transition-colors p-1"
        >
          <AppIcon name="close" size={18} />
        </button>

        <h2 className="text-xl font-bold text-crema-100 mb-1 font-sans">
          {language === "vi" ? "Tạo Phòng Làm Việc Mới" : "Create New Workstation"}
        </h2>
        <p className="text-crema-400 text-xs sm:text-sm mb-6 leading-relaxed">
          {language === "vi"
            ? "Chọn phong cách phòng phù hợp với mục tiêu làm việc của nhóm."
            : "Select the discipline archetype best suited for your shift."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="text-[11px] font-mono font-semibold text-crema-600 uppercase tracking-wider mb-1.5 block">
              {language === "vi" ? "Tên Phòng *" : "Room Name *"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={language === "vi" ? "Ví dụ: Quầy Bar Espresso #1" : "e.g. Espresso Bar #1"}
              maxLength={80}
              className="w-full px-3.5 py-2.5 bg-espresso-850 border border-espresso-700 rounded-xl text-crema-100 placeholder:text-crema-600 focus:outline-none focus:border-brass-500/60 text-sm font-sans"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-mono font-semibold text-crema-600 uppercase tracking-wider mb-2 block">
              {language === "vi" ? "Định Dạng Kỷ Luật (Archetype)" : "Discipline Archetype"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ARCHETYPES.map((arch) => (
                <button
                  key={arch.value}
                  type="button"
                  onClick={() => setArchetype(arch.value)}
                  className={cn(
                    "flex flex-col text-left p-3 rounded-xl border transition-all text-xs",
                    archetype === arch.value
                      ? "bg-espresso-800 border-brass-500/60 shadow-sm"
                      : "bg-espresso-850/60 border-espresso-700/60 hover:bg-espresso-800/60"
                  )}
                >
                  <span className={cn(
                    "font-bold mb-1",
                    archetype === arch.value ? "text-brass-300" : "text-crema-200"
                  )}>
                    {arch.label}
                  </span>
                  <span className="text-[11px] text-crema-400 leading-snug">
                    {arch.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-bourbon-400 text-xs text-center font-mono">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-espresso-700/80">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2.5 text-xs font-mono font-semibold text-crema-400 hover:text-crema-100 transition-colors"
            >
              {language === "vi" ? "Hủy" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-5 py-2.5 bg-brass-500 hover:bg-brass-600 disabled:opacity-50 text-espresso-950 text-xs font-mono font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              {loading ? (language === "vi" ? "Đang tạo..." : "Creating...") : (language === "vi" ? "Tạo Phòng" : "Create Room")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
