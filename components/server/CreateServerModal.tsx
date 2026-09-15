"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@radix-ui/react-dialog";
import { AppIcon } from "@/components/ui/Icon";
import { useLanguage } from "@/context/LanguageContext";

interface CreateServerModalProps {
  children?: React.ReactNode;
}

export function CreateServerModal({ children }: CreateServerModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createServer = useMutation(api.servers.createServer);
  const router = useRouter();
  const { t, language } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");
    try {
      const serverId = await createServer({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      });
      setOpen(false);
      setName("");
      setDescription("");
      router.push(`/servers/${serverId}`);
    } catch (err: any) {
      setError(err.message ?? "Đã xảy ra lỗi. Thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <button className="flex items-center gap-2 px-4 py-2 bg-brass-500 hover:bg-brass-600 text-espresso-950 font-mono font-bold text-xs sm:text-sm rounded-xl transition-all shadow-sm active:scale-95">
            <AppIcon name="plus" size={16} />
            <span>{t("nav_create_server")}</span>
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <div className="relative bg-espresso-900 rounded-2xl p-6 w-full max-w-md border border-espresso-700 shadow-2xl z-10 select-none">
          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-crema-600 hover:text-crema-200 transition-colors p-1"
          >
            <AppIcon name="close" size={18} />
          </button>

          <div>
            <DialogTitle className="text-xl font-bold text-crema-100 mb-1 flex items-center gap-2 font-sans">
              <AppIcon name="coffee" size={22} className="text-brass-500" />
              <span>{t("nav_create_server")}</span>
            </DialogTitle>
            <DialogDescription className="text-crema-400 text-xs sm:text-sm leading-relaxed">
              {language === "vi"
                ? "Thiết lập không gian học tập và làm việc chuyên sâu cho nhóm hoặc cộng đồng của bạn."
                : "Establish a dedicated cohort station for your study group or deep work community."}
            </DialogDescription>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <div>
              <label className="text-[11px] font-mono font-semibold text-crema-600 uppercase tracking-wider mb-1.5 block">
                {language === "vi" ? "Tên Không Gian *" : "Station Name *"}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === "vi" ? "Ví dụ: Midnight Deep Work Cohort" : "e.g. Midnight Deep Work Cohort"}
                maxLength={80}
                className="w-full px-3.5 py-2.5 bg-espresso-850 border border-espresso-700 rounded-xl text-crema-100 placeholder:text-crema-600 focus:outline-none focus:border-brass-500/60 text-sm font-sans"
                required
              />
            </div>

            <div>
              <label className="text-[11px] font-mono font-semibold text-crema-600 uppercase tracking-wider mb-1.5 block">
                {language === "vi" ? "Mô Tả Không Gian" : "Description"}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === "vi" ? "Mục tiêu, nội quy hoặc đối tượng tham gia..." : "Station goals, guidelines, or target members..."}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-espresso-850 border border-espresso-700 rounded-xl text-crema-100 placeholder:text-crema-600 focus:outline-none focus:border-brass-500/60 text-sm font-sans resize-none"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-espresso-850/60 rounded-xl border border-espresso-700/60">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 rounded accent-brass-500"
              />
              <label htmlFor="isPublic" className="text-xs text-crema-200 cursor-pointer">
                {language === "vi"
                  ? "Công khai (Hiển thị trong mục Khám phá)"
                  : "Public Station (Visible in Explore page)"}
              </label>
            </div>

            {error && (
              <p className="text-bourbon-400 text-xs text-center font-mono">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
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
                {loading ? (language === "vi" ? "Đang tạo..." : "Creating...") : (language === "vi" ? "Tạo Không Gian" : "Launch Station")}
              </button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
