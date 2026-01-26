"use client";

import { useEffect, useMemo } from "react";
import { MessageItem } from "./MessageItem";
import { MessageDateSeparator } from "./MessageDateSeparator";
import { EmptyState } from "./EmptyState";
import { useAutoScroll } from "./hooks/use-auto-scroll";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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
  const { scrollRef, shouldAutoScroll, scrollToBottom } = useAutoScroll<HTMLDivElement>();

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

  // Auto-scroll при новых сообщениях
  useEffect(() => {
    if (shouldAutoScroll && messages.length > 0) {
      scrollToBottom();
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
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
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
            <MessageItem
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// Импорт cn для использования в Loading состоянии
import { cn } from "@/lib/utils";
