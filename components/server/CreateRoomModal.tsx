"use client";
// components/server/CreateRoomModal.tsx
// StudyStream OS — Modal for creating a new study room with archetype selection

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn, getArchetypeLabel } from "@/lib/utils";
import { X } from "lucide-react";

const ARCHETYPES = [
  { value: "SILENT_FOCUS", label: "🤫 Im Lặng Tuyệt Đối", desc: "Camera on, micro tắt cưỡng chế. Body doubling thuần túy." },
  { value: "CAM_ACCOUNTABILITY", label: "📹 Cam-On Accountability", desc: "Bắt buộc bật webcam. Tắt 3 phút tự chuyển sang Spectator." },
  { value: "SYNC_POMODORO", label: "⏱️ Pomodoro Đồng Bộ", desc: "Cả phòng cùng học, cùng nghỉ theo đồng hồ máy chủ." },
  { value: "AMBIENT_LOFI", label: "☕ Ambient Cafe/Lofi", desc: "Âm thanh môi trường chạy sẵn. Không gian thư giãn." },
  { value: "PAIR_SCREENSHARE", label: "💻 Pair Code & Screenshare", desc: "Chia sẻ màn hình 1080p cho cặp lập trình / bài tập nhóm." },
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
      <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
      <div className="relative bg-neutral-900 rounded-2xl p-6 w-full max-w-lg border border-neutral-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-300"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-neutral-100 mb-1">Tạo Phòng Học Mới</h2>
        <p className="text-neutral-400 text-sm mb-6">Chọn loại phòng phù hợp với mục tiêu học tập.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Room name */}
          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 block">
              Tên Phòng *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Thư Viện Đêm Khuya"
              maxLength={80}
              className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 text-sm"
              required
            />
          </div>

          {/* Archetype selection */}
          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">
              Loại Phòng
            </label>
            <div className="grid grid-cols-1 gap-2">
              {ARCHETYPES.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setArchetype(a.value)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border text-left transition-colors",
                    archetype === a.value
                      ? "border-indigo-500 bg-indigo-950/40"
                      : "border-neutral-700 bg-neutral-800 hover:border-neutral-600"
                  )}
                >
                  <div className="flex-1">
                    <p className={cn("font-medium text-sm", archetype === a.value ? "text-indigo-300" : "text-neutral-200")}>
                      {a.label}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">{a.desc}</p>
                  </div>
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 mt-0.5 shrink-0",
                    archetype === a.value
                      ? "border-indigo-500 bg-indigo-500"
                      : "border-neutral-600"
                  )} />
                </button>
              ))}
            </div>
          </div>

          {/* Max participants */}
          <div>
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 block">
              Số Người Tối Đa: {maxParticipants}
            </label>
            <input
              type="range"
              min={2}
              max={50}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value))}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-xs text-neutral-600">
              <span>2</span>
              <span>50</span>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/30 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            {loading ? "Đang tạo..." : "✨ Tạo Phòng Học"}
          </button>
        </form>
      </div>
    </div>
  );
}
