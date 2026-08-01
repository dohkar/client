"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
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
  const { scrollRef, shouldAutoScroll, scrollToBottom } = useAutoScroll<HTMLDivElement>();
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
    const firstUnread = messages.find((m) => m.senderId !== currentUserId && !m.isRead);
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
      queueMicrotask(() => {
        setNewMessagesCount(0);
      });
    } else {
      // пользователь не внизу — показываем кнопку вниз
      queueMicrotask(() => {
        setNewMessagesCount((c) => c + (messages.length - prevLen));
      });
    }
  }, [messages.length, shouldAutoScroll, scrollToBottom]);

  if (isLoading) {
    return (
      <div className='flex-1 min-h-0 overflow-y-auto p-4 space-y-4'>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}
          >
            <Skeleton className='h-16 w-2/3 rounded-lg' />
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className='flex-1 min-h-0 flex flex-col'>
        <EmptyState
          type={chatType === "SUPPORT" ? "support-empty" : "no-messages"}
          chatType={chatType}
        />
      </div>
    );
  }

  return (
    <div ref={scrollRef} className='relative flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 sm:p-4'>
      {hasMore && (
        <div className='flex justify-center mb-4'>
          <Button
            onClick={onLoadMore}
            disabled={isFetchingMore}
            variant='outline'
            size='sm'
          >
            {isFetchingMore ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                Загрузка...
              </>
            ) : (
              "Загрузить старые сообщения"
            )}
          </Button>
        </div>
      )}

      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex}>
          <MessageDateSeparator date={group.date} />
          {group.messages.map((message) => (
            <div key={message.id}>
              {firstUnreadId === message.id && (
                <div className='my-3 flex items-center gap-3'>
                  <div className='h-px flex-1 bg-border' />
                  <span className='text-xs text-muted-foreground'>Непрочитанные</span>
                  <div className='h-px flex-1 bg-border' />
                </div>
              )}
              <MessageItem message={message} isOwn={message.senderId === currentUserId} />
            </div>
          ))}
        </div>
      ))}

      {/* Кнопка «вниз» — absolute, не мешает composer (Telegram-style) */}
      {newMessagesCount > 0 && (
        <div className='sticky bottom-3 flex justify-end pointer-events-none pr-1'>
          <Button
            type='button'
            variant='secondary'
            size='icon'
            className='pointer-events-auto shadow-md rounded-full size-10 opacity-95'
            aria-label={
              newMessagesCount > 1
                ? `Вниз, новых сообщений: ${newMessagesCount}`
                : "Вниз"
            }
            onClick={() => {
              scrollToBottom();
              setNewMessagesCount(0);
            }}
          >
            <ArrowDown className='h-4 w-4' />
            {newMessagesCount > 1 && (
              <span className='absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex items-center justify-center'>
                {newMessagesCount > 9 ? "9+" : newMessagesCount}
              </span>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
