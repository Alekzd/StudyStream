"use client";
// components/room/ChatDrawer.tsx
// StudyStream OS — Room text chat drawer

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatDrawerProps {
  roomId: Id<"rooms">;
  serverId: Id<"servers">;
  onClose: () => void;
}

export function ChatDrawer({ roomId, serverId, onClose }: ChatDrawerProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(api.chat.getMessages, { roomId, limit: 100 });
  const sendMessage = useMutation(api.chat.sendMessage);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSending) return;

    setIsSending(true);
    try {
      await sendMessage({
        roomId,
        serverId,
        content: content.trim(),
      });
      setContent("");
    } catch (err: any) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full z-20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <h3 className="font-semibold text-neutral-200 text-sm">💬 Trò Chuyện Phòng</h3>
        <button
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-300 transition-colors p-1"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages === undefined ? (
          <div className="text-center text-neutral-500 text-xs py-8 animate-pulse">
            Đang tải tin nhắn...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-neutral-500 text-xs py-8">
            Chưa có tin nhắn nào. Hãy gửi lời chào đến bạn học!
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={cn(
                "flex flex-col text-sm",
                msg.isSystemNotice && "bg-neutral-800/60 p-2 rounded-lg border border-neutral-700/50"
              )}
            >
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="font-semibold text-xs text-indigo-400">
                  {msg.sender?.name ?? "Bạn học"}
                </span>
                <span className="text-[10px] text-neutral-500">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-neutral-300 break-words text-xs leading-relaxed">
                {msg.content}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="p-3 border-t border-neutral-800 flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nhập tin nhắn..."
          maxLength={1000}
          className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 text-xs focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!content.trim() || isSending}
          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
