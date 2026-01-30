"use client";

import { useMemo, useState } from "react";
import { Check, CheckCheck, Clock, UserIcon, CopyIcon } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean; // для чужих — показывать аватар
  avatarUrl?: string | null; // url аватара собеседника
  showStatus?: boolean;
}

export function MessageItem({
  message,
  isOwn,
  showAvatar = true,
  avatarUrl,
  showStatus = true,
}: MessageItemProps) {
  const [copied, setCopied] = useState(false);

  const deliveryStatus = useMemo<"sending" | "sent" | "read">(() => {
    if (message.id.startsWith("temp-")) return "sending";
    if (message.isRead) return "read";
    return "sent";
  }, [message.id, message.isRead]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      toast.success("Скопировано", { duration: 1500 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  return (
    <div
      className={cn(
        "flex w-full mb-3 group",
        isOwn ? "justify-end" : "justify-start gap-2"
      )}
    >
      {/* Аватар слева для чужих сообщений */}
      {!isOwn && showAvatar && (
        <div className='flex-shrink-0 pt-1'>
          <Avatar>
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt='Аватар' className='object-cover' />
            ) : null}
            <AvatarFallback className='bg-gradient-to-br from-muted to-muted-foreground/30 flex items-center justify-center rounded-full border border-border shadow-inner'>
              <UserIcon className='h-7 w-7 text-primary/70' fill='currentColor' />
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      <div
        className={cn(
          "relative max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words shadow-sm transition-all",
          // Bubble с хвостиком
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-none after:content-[''] after:absolute after:bottom-0 after:right-[-6px] after:border-[6px] after:border-transparent after:border-l-primary after:border-b-primary"
            : "bg-muted text-foreground rounded-bl-none after:content-[''] after:absolute after:bottom-0 after:left-[-6px] after:border-[6px] after:border-transparent after:border-r-muted after:border-b-muted",
          // Hover-эффект
          "group-hover:shadow-md"
        )}
      >
        {/* Кнопка копирования */}
        <button
          onClick={handleCopy}
          className={cn(
            "absolute cursor-pointer -top-2 -right-2 p-1.5 rounded-full bg-background border border-border shadow-sm transition-all",
            copied ? "opacity-100 scale-110" : "opacity-0 group-hover:opacity-100"
          )}
          aria-label='Копировать'
        >
          {copied ? (
            <Check className='h-3.5 w-3.5 text-green-500' />
          ) : (
            <CopyIcon className='h-3.5 w-3.5 text-muted-foreground' />
          )}
        </button>

        {/* Текст */}
        <p className='leading-relaxed'>{message.text}</p>

        {/* Время + статус */}
        <div className='flex items-center justify-end gap-1.5 mt-1'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "text-xs opacity-70",
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  )}
                >
                  {formatRelativeTime(message.createdAt)}
                </span>
              </TooltipTrigger>
              <TooltipContent side='top'>
                <p>{formatAbsoluteTime(message.createdAt)}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Статус только для своих */}
          {isOwn && showStatus && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className='text-primary-foreground/70'>
                    {deliveryStatus === "sending" ? (
                      <Clock className='h-3.5 w-3.5 animate-pulse' />
                    ) : deliveryStatus === "read" ? (
                      <CheckCheck className='h-3.5 w-3.5 text-blue-400' />
                    ) : (
                      <Check className='h-3.5 w-3.5' />
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent side='top'>
                  {deliveryStatus === "sending"
                    ? "Отправляется..."
                    : deliveryStatus === "read"
                      ? "Прочитано"
                      : "Отправлено"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
}
