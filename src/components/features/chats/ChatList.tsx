"use client";

import { formatRelativeTime } from "@/lib/utils/chat-format";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";
import { MessageSquare, Archive } from "lucide-react";
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
  if (isLoading) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 space-y-2">
            <div className="flex items-start justify-between">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (chats.length === 0) {
    return <EmptyState type="no-chats" />;
  }

  return (
    <div className="overflow-y-auto">
      {chats.map((chat) => (
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

interface ChatListItemProps {
  chat: Chat;
  isSelected: boolean;
  onClick: () => void;
}

function ChatListItem({ chat, isSelected, onClick }: ChatListItemProps) {
  const isPropertyChat = chat.type === "PROPERTY";
  const hasUnread = chat.unreadCount > 0;

  // Заголовок чата
  const title = isPropertyChat && chat.property
    ? chat.property.title
    : "Поддержка";

  // Превью последнего сообщения
  const preview = chat.lastMessageText || "Нет сообщений";

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-4 border-b transition-colors hover:bg-muted/50",
        isSelected && "bg-muted"
      )}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h3
            className={cn(
              "font-medium text-sm truncate",
              hasUnread && "font-semibold"
            )}
          >
            {title}
          </h3>
          {chat.isArchived && (
            <Archive className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {chat.lastMessageAt && (
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(chat.lastMessageAt)}
            </span>
          )}
          {hasUnread && (
            <Badge variant="default" className="h-5 min-w-5 px-1.5 text-xs">
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
