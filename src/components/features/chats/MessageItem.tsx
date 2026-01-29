"use client";

import { useMemo, useState } from "react";
import { Check, CheckCheck, Copy, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatAbsoluteTime } from "@/lib/utils/chat-format";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Message } from "@/types/chat";

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showStatus?: boolean;
}

export function MessageItem({ message, isOwn, showStatus = true }: MessageItemProps) {
  const [copied, setCopied] = useState(false);

  const deliveryStatus = useMemo<"sending" | "sent" | "read">(() => {
    // Временные сообщения считаем "sending"
    if (message.id.startsWith("temp-")) return "sending";
    if (message.isRead) return "read";
    return "sent";
  }, [message.id, message.isRead]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      toast.success("Текст скопирован");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать текст");
    }
  };

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          // reserve space for status icon to avoid layout shift
          "max-w-[70%] rounded-lg px-4 py-2 group relative pr-8",
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {/* Кнопка копирования */}
        <button
          onClick={handleCopy}
          className="absolute cursor-pointer hidden lg:block -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded-full p-1.5 shadow-sm"
          aria-label="Копировать текст"
        >
          <Copy className="h-3 w-3" />
        </button>

        {/* Текст сообщения */}
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>

        {/* Время */}
        <div
          className={cn(
            "flex items-center gap-1 mt-1",
            isOwn ? "justify-end" : "justify-start"
          )}
        >
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "text-xs",
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {formatRelativeTime(message.createdAt)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{formatAbsoluteTime(message.createdAt)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

        </div>

        {/* Статус доставки (только для своих, минималистично, без текста) */}
        {isOwn && showStatus && (
          <span
            className={cn(
              "absolute right-2 bottom-2",
              "text-primary-foreground/60"
            )}
            aria-label={`status-${deliveryStatus}`}
          >
            {deliveryStatus === "sending" ? (
              <Clock className="h-3 w-3 opacity-60" />
            ) : deliveryStatus === "read" ? (
              <CheckCheck className="h-3 w-3" />
            ) : (
              <Check className="h-3 w-3" />
            )}
          </span>
        )}
      </div>
    </div>
  );
}
