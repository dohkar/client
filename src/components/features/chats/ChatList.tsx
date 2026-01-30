"use client";
import { useMemo } from "react";
import { formatRelativeTime } from "@/lib/utils/chat-format";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { Archive, LifeBuoy } from "lucide-react";
import { ChatType } from "@/types/chat";
import type { Chat } from "@/types/chat";

interface ChatListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  isLoading?: boolean;
}

export function ChatList({
  chats,
  selectedChatId,
  onSelectChat,
  isLoading = false,
}: ChatListProps) {
  // Всегда вызываем хуки в начале, до return
  const sortedChats = useMemo(() => {
    const supportChats = chats.filter((chat) => chat.type === ChatType.SUPPORT);
    const otherChats = chats.filter((chat) => chat.type !== ChatType.SUPPORT);

    const sortedOtherChats = [...otherChats].sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });

    return [...supportChats, ...sortedOtherChats];
  }, [chats]);

  if (isLoading) {
    return (
      <div className='space-y-2 p-2'>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className='p-4 space-y-2'>
            <div className='flex items-start justify-between'>
              <Skeleton className='h-5 w-2/3' />
              <Skeleton className='h-4 w-12' />
            </div>
            <Skeleton className='h-4 w-full' />
          </div>
        ))}
      </div>
    );
  }

  if (chats.length === 0) {
    return <EmptyState type='no-chats' />;
  }

  return (
    <div className='overflow-y-auto'>
      {sortedChats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          isSelected={chat.id === selectedChatId}
          onClick={() => onSelectChat(chat.id)}
        />
      ))}
    </div>
  );
}

// ChatListItem остаётся без изменений
interface ChatListItemProps {
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
}

function ChatListItem({ chat, isSelected, onClick }: ChatListItemProps) {
  const isPropertyChat = chat.type === ChatType.PROPERTY;
  const isSupportChat = chat.type === ChatType.SUPPORT;
  const hasUnread = chat.unreadCount > 0;

  const title =
    isPropertyChat && chat.property
      ? chat.property.title
      : isSupportChat
        ? "Техническая поддержка"
        : "Поддержка";

  const preview = chat.lastMessageText || "Нет сообщений";

  return (
    <button
      onClick={onClick}
      className={cn(
        `w-full ${isSelected ? "cursor-default" : "cursor-pointer"} text-left p-4 border-b transition-colors hover:bg-muted/50`,
        isSelected && "bg-muted"
      )}
    >
      <div className='flex items-start justify-between mb-1'>
        <div className='flex items-center gap-2 flex-1 min-w-0'>
          {isSupportChat && <LifeBuoy className='h-4 w-4 text-primary shrink-0' />}
          <h3
            className={cn("font-medium text-sm truncate", hasUnread && "font-semibold")}
          >
            {title}
          </h3>
          {isSupportChat && (
            <Badge variant='secondary' className='shrink-0 text-xs'>
              Поддержка
            </Badge>
          )}
          {chat.isArchived && !isSupportChat && (
            <Archive className='h-3 w-3 text-muted-foreground shrink-0' />
          )}
        </div>
        <div className='flex items-center gap-2 shrink-0'>
          {chat.lastMessageAt && (
            <span className='text-xs text-muted-foreground'>
              {formatRelativeTime(chat.lastMessageAt)}
            </span>
          )}
          {hasUnread && (
            <Badge variant='default' className='h-5 min-w-5 px-1.5 text-xs'>
              {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
            </Badge>
          )}
        </div>
      </div>
      <p
        className={cn(
          "text-sm text-muted-foreground truncate",
          hasUnread && "font-medium text-foreground"
        )}
      >
        {preview}
      </p>
    </button>
  );
}
