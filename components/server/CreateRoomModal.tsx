"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn, getArchetypeIcon, getArchetypeColor } from "@/lib/utils";
import { AppIcon } from "@/components/ui/Icon";
import { MotionButton } from "@/components/ui/motion";
import { useLanguage } from "@/context/LanguageContext";

const ARCHETYPES = [
  {
    value: "SILENT_FOCUS",
    labelEn: "Only Cam (Silent)",
    labelVi: "Chỉ Bật Cam (Silent)",
    tagEn: "Cam On • Mute",
    tagVi: "Bật Cam • Tắt Mic",
    descEn: "Camera on. Mic muted 100%, no talking.",
    descVi: "Chỉ bật webcam. Tắt mic 100%, không nói chuyện.",
  },
  {
    value: "SYNC_POMODORO",
    labelEn: "Sync Pomodoro",
    labelVi: "Pomodoro Chung",
    tagEn: "Shared Clock",
    tagVi: "Chung Giờ",
    descEn: "Entire room works and rests together on the same timer.",
    descVi: "Cả phòng đếm giờ học và nghỉ cùng lúc theo đồng hồ.",
  },
  {
    value: "AMBIENT_LOFI",
    labelEn: "Chill & Music",
    labelVi: "Phòng Chill & Nhạc",
    tagEn: "Mic Allowed",
    tagVi: "Mic Tự Do",
    descEn: "Background music (cafe/rain), mic allowed.",
    descVi: "Có nhạc nền (cafe/mưa), được bật mic nói chuyện.",
  },
  {
    value: "CAM_ACCOUNTABILITY",
    labelEn: "Cam Enforced",
    labelVi: "Kỷ Luật Cam",
    tagEn: "Off 3m = Kick",
    tagVi: "Tắt 3p = Kick",
    descEn: "Webcam required. Off for 3 minutes triggers kick.",
    descVi: "Bắt buộc mở cam. Tắt quá 3 phút tự động bị đẩy ra.",
  },
  {
    value: "PAIR_SCREENSHARE",
    labelEn: "Screenshare",
    labelVi: "Share Màn Hình",
    tagEn: "Mic + 1080p",
    tagVi: "Mic + 1080p",
    descEn: "Open voice chat & 1080p screensharing.",
    descVi: "Bật mic trao đổi & chia sẻ màn hình 1080p.",
  },
  {
    value: "SANDBOX_TEST",
    labelEn: "Device Test (Sandbox)",
    labelVi: "Phòng Test Thiết Bị",
    tagEn: "No Stats",
    tagVi: "Không Lưu Giờ",
    descEn: "Test camera, mic and network. Does not log study time.",
    descVi: "Thử mic, webcam, kiểm tra mạng. Không tính vào giờ học.",
  },
] as const;

const CADENCE_OPTIONS = [
  {
    value: "50/10",
    label: "50 / 10",
    descEn: "50m work • 10m break",
    descVi: "50p học • 10p nghỉ",
  },
  {
    value: "25/5",
    label: "25 / 5",
    descEn: "25m work • 5m break",
    descVi: "25p học • 5p nghỉ",
  },
  {
    value: "90/20",
    label: "90 / 20",
    descEn: "90m work • 20m break",
    descVi: "90p học • 20p nghỉ",
  },
] as const;

type Archetype = typeof ARCHETYPES[number]["value"];

interface CreateRoomModalProps {
  serverId?: Id<"servers">;
  categoryId?: Id<"roomCategories">;
  children?: React.ReactNode;
  onCreated?: (roomId: Id<"rooms">) => void;
}

export function CreateRoomModal({ serverId, categoryId, children, onCreated }: CreateRoomModalProps) {
  const { language } = useLanguage();
  const isVi = language === "vi";

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [archetype, setArchetype] = useState<Archetype>("SILENT_FOCUS");
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState("");
  const [cadence, setCadence] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("studystream_default_cadence") || "50/10";
    }
    return "50/10";
  });
  const [maxParticipants] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createRoom = useMutation(api.rooms.createRoom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (isLocked && !password.trim()) {
      setError(isVi ? "Vui lòng nhập mật khẩu cho phòng khóa." : "Please enter a password for locked room.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const newRoomId = await createRoom({
        serverId,
        categoryId,
        name: name.trim(),
        archetype,
        maxParticipants,
        isLocked,
        password: isLocked ? password.trim() : undefined,
        pomodoroCadence: cadence,
      });
      setOpen(false);
      setName("");
      setPassword("");
      setIsLocked(false);
      if (onCreated && newRoomId) {
        onCreated(newRoomId as Id<"rooms">);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (isVi ? "Tạo phòng thất bại. Thử lại." : "Failed to create room. Please try again.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    if (children) {
      return (
        <span onClick={() => setOpen(true)} className="cursor-pointer inline-flex">
          {children}
        </span>
      );
    }
    return (
      <MotionButton
        variant="brass"
        size="sm"
        onClick={() => setOpen(true)}
        leftIcon={<AppIcon name="plus" size={14} />}
      >
        <span>{isVi ? "Tạo Phòng" : "New Room"}</span>
      </MotionButton>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4" style={{ paddingTop: "max(3.5rem, env(safe-area-inset-top))" }}>
      {/* Crisp dark backdrop */}
      <div
        className="fixed inset-0 bg-black/80 transition-opacity"
        onClick={() => setOpen(false)}
      />

      {/* Modal Dialog Card */}
      <div className="relative bg-espresso-900 rounded-2xl p-4 sm:p-6 w-full max-w-xl border border-espresso-700 shadow-2xl max-h-[88svh] overflow-y-auto z-10 select-none text-crema-100">
        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-crema-600 hover:text-crema-200 transition-colors p-1.5 rounded-lg hover:bg-espresso-800"
          aria-label="Close dialog"
        >
          <AppIcon name="close" size={18} />
        </button>

        <h2 className="text-lg sm:text-xl font-bold text-crema-100 mb-1 font-sans tracking-tight">
          {isVi ? "Tạo Phòng Học" : "Create Room"}
        </h2>
        <p className="text-crema-400 text-xs mb-4">
          {isVi ? "Chọn chế độ phòng và thiết lập." : "Select room mode and settings."}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 1. Room Name Input */}
          <div>
            <label className="text-[11px] font-mono font-semibold text-crema-400 uppercase tracking-wider mb-1.5 block">
              {isVi ? "Tên phòng *" : "Room Name *"}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isVi ? "Ví dụ: Phòng 01, Pomodoro Sprint..." : "e.g. Focus Room #1"}
              maxLength={80}
              autoFocus
              className="w-full px-3.5 py-2.5 bg-espresso-850 border border-espresso-700 rounded-xl text-crema-100 placeholder:text-crema-600 focus:outline-none focus:border-brass-500/60 text-sm font-sans"
              required
            />
          </div>

          {/* 2. Privacy & Access Setting */}
          <div>
            <label className="text-[11px] font-mono font-semibold text-crema-400 uppercase tracking-wider mb-1.5 block">
              {isVi ? "Quyền Truy Cập" : "Access"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsLocked(false)}
                className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-xl border text-xs text-left transition-all",
                  !isLocked
                    ? "bg-patina-900/30 border-patina-500/60 text-crema-100 shadow-sm"
                    : "bg-espresso-850/60 border-espresso-700/60 text-crema-400 hover:bg-espresso-800"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  !isLocked ? "bg-patina-500/20 text-patina-400" : "bg-espresso-750 text-crema-600"
                )}>
                  <AppIcon name="globe" size={15} />
                </div>
                <div>
                  <div className="font-semibold text-xs">
                    {isVi ? "Phòng Công Khai" : "Public Room"}
                  </div>
                  <div className="text-[10px] text-crema-400">
                    {isVi ? "Ai cũng vào được" : "Anyone can join"}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsLocked(true)}
                className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-xl border text-xs text-left transition-all",
                  isLocked
                    ? "bg-bourbon-900/30 border-bourbon-500/60 text-crema-100 shadow-sm"
                    : "bg-espresso-850/60 border-espresso-700/60 text-crema-400 hover:bg-espresso-800"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                  isLocked ? "bg-bourbon-500/20 text-bourbon-400" : "bg-espresso-750 text-crema-600"
                )}>
                  <AppIcon name="lock" size={15} />
                </div>
                <div>
                  <div className="font-semibold text-xs">
                    {isVi ? "Phòng Khóa (Riêng Tư)" : "Locked / Private"}
                  </div>
                  <div className="text-[10px] text-crema-400">
                    {isVi ? "Cần mật khẩu để vào" : "Password required to join"}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Password Input (Conditional for Locked Rooms) */}
          {isLocked && (
            <div className="p-3 bg-bourbon-950/40 border border-bourbon-500/40 rounded-xl space-y-1.5 animate-in fade-in duration-200">
              <label className="text-[11px] font-mono font-semibold text-bourbon-300 uppercase tracking-wider flex items-center justify-between">
                <span>{isVi ? "Mật Khẩu Phòng *" : "Room Password *"}</span>
                <span className="text-[10px] text-crema-400 font-normal">
                  {isVi ? "Bắt buộc khi vào phòng" : "Required to join"}
                </span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isVi ? "Nhập mật khẩu (ví dụ: 1234)" : "Enter password (e.g. 1234)"}
                maxLength={30}
                required={isLocked}
                className="w-full px-3.5 py-2 bg-espresso-900 border border-espresso-700 rounded-lg text-crema-100 placeholder:text-crema-600 focus:outline-none focus:border-bourbon-400 text-sm font-sans"
              />
            </div>
          )}

          {/* 4. Discipline Archetype Selection */}
          <div>
            <label className="text-[11px] font-mono font-semibold text-crema-400 uppercase tracking-wider mb-1.5 block">
              {isVi ? "Chế Độ Phòng (Archetype)" : "Room Mode"}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ARCHETYPES.map((arch) => (
                <button
                  key={arch.value}
                  type="button"
                  onClick={() => setArchetype(arch.value)}
                  className={cn(
                    "flex flex-col text-left p-2.5 rounded-xl border transition-all text-xs relative",
                    archetype === arch.value
                      ? "bg-espresso-800 border-brass-500/60 shadow-sm"
                      : "bg-espresso-850/60 border-espresso-700/60 hover:bg-espresso-800/60"
                  )}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className={cn(
                      "font-bold flex items-center gap-1.5 truncate",
                      archetype === arch.value ? "text-brass-300" : "text-crema-200"
                    )}>
                      <AppIcon name={getArchetypeIcon(arch.value)} size={15} className={getArchetypeColor(arch.value)} />
                      <span>{isVi ? arch.labelVi : arch.labelEn}</span>
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-espresso-750 text-brass-400 shrink-0">
                      {isVi ? arch.tagVi : arch.tagEn}
                    </span>
                  </div>
                  <span className="text-[11px] text-crema-400 leading-snug">
                    {isVi ? arch.descVi : arch.descEn}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Cadence Selection */}
          {archetype === "AMBIENT_LOFI" ? (
            <div className="p-3 rounded-xl bg-espresso-850/60 border border-espresso-750/70 flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <AppIcon name="coffee" size={16} className="text-brass-400" />
                <span className="text-xs text-crema-200 font-medium">
                  {isVi ? "Chế độ Chill & Nhạc: Không áp dụng Pomodoro (Tự do)" : "Chill & Music: Pomodoro disabled (Free flow)"}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-espresso-750 text-brass-400">
                {isVi ? "Tự Do" : "Free"}
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-espresso-850/70 border border-espresso-700/70">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-mono font-semibold text-brass-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AppIcon name="clock" size={13} />
                  <span>{isVi ? "Nhịp Pomodoro" : "Pomodoro Rhythm"}</span>
                </label>
                <span className="text-[10px] font-mono text-crema-400">
                  {isVi ? "Đồng hồ cả phòng chạy theo nhịp này" : "Shared timer pace"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {CADENCE_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCadence(c.value)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all cursor-pointer",
                      cadence === c.value
                        ? "bg-brass-500/20 border-brass-500/70 text-crema-100 shadow-sm"
                        : "bg-espresso-900 border-espresso-750 text-crema-400 hover:bg-espresso-800"
                    )}
                  >
                    <span className="font-mono font-bold text-sm text-brass-300">{c.label}</span>
                    <span className="text-[9px] font-mono text-crema-400 mt-0.5 leading-tight line-clamp-2 w-full">
                      {isVi ? c.descVi : c.descEn}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-bourbon-400 text-xs text-center font-mono py-1">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-espresso-700/80">
            <MotionButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
            >
              {isVi ? "Hủy" : "Cancel"}
            </MotionButton>
            <MotionButton
              type="submit"
              variant="brass"
              size="sm"
              isLoading={loading}
              disabled={!name.trim()}
            >
              {isVi ? "Tạo Phòng" : "Create Room"}
            </MotionButton>
          </div>
        </form>
      </div>
    </div>
  );
}
