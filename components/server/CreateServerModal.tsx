"use client";
// components/server/CreateServerModal.tsx
// StudyStream OS — Modal for creating a new Study Hub/Campus

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
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

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
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
            + Tạo Không Gian Học
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
        <div className="relative bg-neutral-900 rounded-2xl p-6 w-full max-w-md border border-neutral-700 shadow-2xl">
          {/* Close button */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-300"
          >
            <X size={20} />
          </button>

          <div>
            <DialogTitle className="text-xl font-bold text-neutral-100 mb-1">
              📹 Tạo Không Gian Học Tập
            </DialogTitle>
            <DialogDescription className="text-neutral-400 text-sm">
              Tạo không gian học tập riêng cho nhóm bạn, lớp học hoặc cộng đồng.
            </DialogDescription>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
            {/* Server name */}
            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 block">
                Tên Không Gian *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: IELTS 8.0 Warriors"
                maxLength={80}
                className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 text-sm"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 block">
                Mô Tả (tuỳ chọn)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mục tiêu và quy tắc của không gian học tập..."
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2.5 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-indigo-500 text-sm resize-none"
              />
            </div>

            {/* Visibility toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-neutral-300">Hiển thị công khai</p>
                <p className="text-xs text-neutral-500">
                  Mọi người có thể tìm kiếm và tham gia
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={cn(
                  "w-11 h-6 rounded-full transition-colors relative",
                  isPublic ? "bg-indigo-600" : "bg-neutral-700"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                    isPublic ? "translate-x-5" : "translate-x-0.5"
                  )}
                />
              </button>
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
              {loading ? "Đang tạo..." : "✨ Tạo Không Gian Học"}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
