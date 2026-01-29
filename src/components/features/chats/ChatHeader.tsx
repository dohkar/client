"use client";

import { ArrowLeft, Archive, LifeBuoy } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatPrice } from "@/lib/utils/format";
import { formatRelativeTime } from "@/lib/utils/chat-format";
import { useAuthStore } from "@/stores";
import type { Chat } from "@/types/chat";

interface ChatHeaderProps {
  chat: Chat;
  onBack?: () => void;
  isOtherOnline?: boolean;
  isOtherTyping?: boolean;
  isRealtimeConnected?: boolean;
  isFallbackPolling?: boolean;
  isConnecting?: boolean;
}

export function ChatHeader({
  chat,
  onBack,
  isOtherOnline,
  isOtherTyping,
  isRealtimeConnected,
  isFallbackPolling,
  isConnecting,
}: ChatHeaderProps) {
  const isPropertyChat = chat.type === "PROPERTY";
  const isSupportChat = chat.type === "SUPPORT";
  const isArchived = chat.isArchived;

  const currentUserId = useAuthStore((s) => s.user?.id) || null;

  const otherParticipant = useMemo(() => {
    if (!currentUserId) return null;
    return chat.participants.find((p) => p.userId !== currentUserId) || null;
  }, [chat.participants, currentUserId]);

  const otherUser = otherParticipant?.user || null;
  const otherName = otherUser?.name || "Пользователь";

  const lastSeenText = useMemo(() => {
    if (!otherUser || !otherUser.lastSeenAt) return null;
    return `был(а) ${formatRelativeTime(otherUser.lastSeenAt)}`;
  }, [otherUser, otherUser?.lastSeenAt]);

  return (
    <div className="border-b bg-background p-4">
      <div className="flex items-center gap-3">
        {/* Кнопка назад (mobile) */}
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Информация о чате */}
        <div className="flex-1 min-w-0">
          {isPropertyChat && chat.property ? (
            <div className="space-y-1">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={otherUser?.avatar || undefined} alt={otherName} />
                  <AvatarFallback>
                    {(otherName[0] || "U").toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <h2 className="font-semibold text-base truncate">{otherName}</h2>
                    {isArchived && (
                      <Badge variant="secondary" className="shrink-0">
                        <Archive className="h-3 w-3 mr-1" />
                        Объявление удалено
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    {isOtherTyping ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <span>Печатает</span>
                        <span className="inline-flex items-end gap-0.5">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/80 animate-bounce [animation-delay:-0.2s]" />
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/80 animate-bounce [animation-delay:-0.1s]" />
                          <span className="h-1 w-1 rounded-full bg-muted-foreground/80 animate-bounce" />
                        </span>
                      </span>
                    ) : isOtherOnline !== undefined ? (
                      <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <span
                            className={[
                              "inline-flex h-1.5 w-1.5 rounded-full",
                              isOtherOnline ? "bg-green-500" : "bg-muted-foreground",
                            ].join(" ")}
                          />
                          {isOtherOnline ? "Онлайн" : null}
                        </span>
                        {!isOtherOnline && lastSeenText && (
                          <span className="truncate">{lastSeenText}</span>
                        )}
                      </span>
                    ) : null}
                  </div>

                  {/* Connection lifecycle hint (muted, no toasts) */}
                  {!isOtherTyping && (
                    <div className="text-xs text-muted-foreground/80">
                      {isRealtimeConnected
                        ? null
                        : isConnecting
                          ? "Подключение…"
                          : isFallbackPolling
                            ? "Нет соединения (polling)"
                            : "Нет соединения"}
                    </div>
                  )}
                </div>
              </div>

              <p className="text-sm text-muted-foreground truncate">
                {chat.property.title} · {formatPrice(chat.property.price)}
              </p>
            </div>
          ) : isSupportChat ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-primary shrink-0" />
                <h2 className="font-semibold text-base">
                  Техническая поддержка Dohkar
                </h2>
                <Badge variant="outline" className="shrink-0 text-xs">
                  <span className="relative flex h-2 w-2 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Онлайн
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Обычно отвечаем в течение 15 минут
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <h2 className="font-semibold text-base">Поддержка</h2>
              <p className="text-sm text-muted-foreground">
                Мы ответим в ближайшее время
              </p>
            </div>
          )}
        </div>

        {(isRealtimeConnected !== undefined || isFallbackPolling !== undefined) && (
          <div className="shrink-0">
            <Badge
              variant={isRealtimeConnected ? "default" : "outline"}
              className="text-xs"
            >
              {isRealtimeConnected ? "Real-time" : isConnecting ? "Connecting" : isFallbackPolling ? "Polling" : "Offline"}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
