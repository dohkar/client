"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageItem } from "./MessageItem";
import { MessageDateSeparator } from "./MessageDateSeparator";
import { EmptyState } from "./EmptyState";
import { useAutoScroll } from "./hooks/use-auto-scroll";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowDown, Loader2 } from "lucide-react";
import { isSameDay } from "date-fns";
import type { Message } from "@/types/chat";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isFetchingMore?: boolean;
  chatType?: "PROPERTY" | "SUPPORT";
}

export function MessageList({
  messages,
  currentUserId,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  isFetchingMore = false,
  chatType,
}: MessageListProps) {
  const { scrollRef, shouldAutoScroll, scrollToBottom } =
    useAutoScroll<HTMLDivElement>();
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const prevLenRef = useRef(0);

  // Группировка сообщений по датам
  const groupedMessages = useMemo(() => {
    const groups: { date: Date; messages: Message[] }[] = [];

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt);
      const lastGroup = groups[groups.length - 1];

      if (lastGroup && isSameDay(lastGroup.date, messageDate)) {
        lastGroup.messages.push(message);
      } else {
        groups.push({
          date: messageDate,
          messages: [message],
        });
      }
    });

    return groups;
  }, [messages]);

  const firstUnreadId = useMemo(() => {
    const firstUnread = messages.find(
      (m) => m.senderId !== currentUserId && !m.isRead
    );
    return firstUnread?.id || null;
  }, [messages, currentUserId]);

  // Auto-scroll при новых сообщениях
  useEffect(() => {
    const prevLen = prevLenRef.current;
    prevLenRef.current = messages.length;

    if (messages.length <= prevLen) {
      return;
    }

    if (shouldAutoScroll && messages.length > 0) {
      scrollToBottom();
      setNewMessagesCount(0);
    } else {
      // пользователь не внизу — показываем кнопку вниз
      setNewMessagesCount((c) => c + (messages.length - prevLen));
    }
  }, [messages.length, shouldAutoScroll, scrollToBottom]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
            <Skeleton className="h-16 w-2/3 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <EmptyState
        type={chatType === "SUPPORT" ? "support-empty" : "no-messages"}
        chatType={chatType}
      />
    );
  }

  return (
    <div ref={scrollRef} className="relative flex-1 overflow-y-auto p-4">
      {/* Кнопка загрузки старых сообщений */}
      {hasMore && (
        <div className="flex justify-center mb-4">
          <Button
            onClick={onLoadMore}
            disabled={isFetchingMore}
            variant="outline"
            size="sm"
          >
            {isFetchingMore ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Загрузка...
              </>
            ) : (
              "Загрузить старые сообщения"
            )}
          </Button>
        </div>
      )}

      {/* Сообщения с группировкой по датам */}
      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex}>
          <MessageDateSeparator date={group.date} />
          {group.messages.map((message) => (
            <div key={message.id}>
              {firstUnreadId === message.id && (
                <div className="my-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">
                    Непрочитанные
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}
              <MessageItem
                message={message}
                isOwn={message.senderId === currentUserId}
              />
            </div>
          ))}
        </div>
      ))}

      {/* Кнопка вниз */}
      {newMessagesCount > 0 && (
        <div className="sticky bottom-3 flex justify-center pointer-events-none">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="pointer-events-auto shadow-sm rounded-full px-3 py-2 opacity-90 transition-opacity"
            onClick={() => {
              scrollToBottom();
              setNewMessagesCount(0);
            }}
          >
            <ArrowDown className="h-4 w-4 mr-2" />
            Вниз
            {newMessagesCount > 1 && (
              <span className="ml-2 text-xs text-muted-foreground">
                +{newMessagesCount}
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Импорт cn для использования в Loading состоянии
import { cn } from "@/lib/utils";
