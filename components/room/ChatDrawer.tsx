"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AppIcon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { MotionButton } from "@/components/ui/motion";

interface ChatDrawerProps {
  roomId: Id<"rooms">;
  serverId: Id<"servers">;
  onClose: () => void;
}

export function ChatDrawer({ roomId, serverId, onClose }: ChatDrawerProps) {
  const { t } = useLanguage();
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(api.chat.getMessages, { roomId, limit: 100 });
  const sendMessage = useMutation(api.chat.sendMessage);

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
    } catch (err: unknown) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full sm:w-80 bg-espresso-900 border-l border-espresso-700/80 flex flex-col h-full z-20 shadow-2xl select-none animate-drawer-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-espresso-700/80 bg-espresso-900">
        <div className="flex items-center gap-2">
          <AppIcon name="chat" size={18} className="text-brass-500" />
          <h3 className="font-semibold text-crema-100 text-sm">
            {t("chat_title")}
          </h3>
        </div>
        <MotionButton
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="w-10 h-10 rounded-lg text-crema-600 hover:text-crema-200"
        >
          <AppIcon name="close" size={18} />
        </MotionButton>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages === undefined ? (
          <div className="text-center text-crema-600 text-xs py-8 animate-pulse font-mono">
            {t("room_loading")}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-crema-600 text-xs py-8 leading-relaxed">
            {t("chat_empty")}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={cn(
                "flex flex-col text-sm",
                msg.isSystemNotice && "bg-espresso-850 p-2.5 rounded-xl border border-espresso-700/80"
              )}
            >
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="font-semibold text-xs text-brass-400">
                  {msg.sender?.name ?? t("room_desk_mates")}
                </span>
                <span className="text-[10px] font-mono text-crema-600">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-crema-200 break-words text-xs leading-relaxed">
                {msg.content}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-espresso-700/80 bg-espresso-900/90 flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("chat_placeholder")}
          className="flex-1 px-3 py-2.5 bg-espresso-850 border border-espresso-700 rounded-xl text-sm text-crema-100 placeholder:text-crema-600 focus:outline-none focus:border-brass-500/50"
          style={{ fontSize: "16px" }}
        />
        <MotionButton
          type="submit"
          variant="brass"
          size="icon"
          disabled={!content.trim() || isSending}
          className="w-10 h-10 rounded-xl shrink-0"
        >
          <AppIcon name="send" size={16} />
        </MotionButton>
      </form>
    </div>
  );
}
