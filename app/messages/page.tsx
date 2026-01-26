"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChatsList, useChatMessages, useSendMessage, useMarkAsRead } from "@/hooks/use-chats";
import { useAuthStore } from "@/stores";
import { ChatList, ChatHeader, MessageList, MessageInput, EmptyState } from "@/components/features/chats";
import { useNotifications } from "@/components/features/chats/hooks/use-notifications";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Message, MessagesResponse } from "@/types/chat";
import type { InfiniteData } from "@tanstack/react-query";

export default function MessagesPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Получаем список чатов
  const { data: chats = [], isLoading: isChatsLoading } = useChatsList();

  // Получаем сообщения активного чата
  const messagesQuery = useChatMessages(selectedChatId, !!selectedChatId);

  // Мутации
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();

  // Notifications
  const { requestPermission, showNotification, permission } = useNotifications();

  // Редирект если не авторизован
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  // Автоматическая пометка как прочитанное при открытии чата
  useEffect(() => {
    if (selectedChatId && !document.hidden) {
      markAsReadMutation.mutate(selectedChatId);
    }
  }, [selectedChatId]);

  // Запрос разрешения на уведомления
  useEffect(() => {
    if (permission === "default") {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Обработчик отправки сообщения
  const handleSendMessage = (text: string) => {
    if (!selectedChatId) return;

    sendMessageMutation.mutate({
      chatId: selectedChatId,
      data: { text },
    });
  };

  // Обработчик выбора чата
  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  // Объединяем все страницы сообщений
  const allMessages: Message[] =
    (messagesQuery.data as InfiniteData<MessagesResponse> | undefined)?.pages
      .flatMap((page) => page.messages) || [];

  // Находим выбранный чат
  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  // Подсчет сообщений от текущего пользователя (для валидации)
  const userMessagesCount = allMessages.filter(
    (msg) => msg.senderId === user?.id
  ).length;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Сообщения</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-180px)]">
          {/* Список чатов */}
          <Card
            className={cn(
              "lg:col-span-4 flex flex-col overflow-hidden",
              selectedChatId && "hidden lg:flex"
            )}
          >
            <div className="border-b p-4">
              <h2 className="font-semibold">Все чаты</h2>
            </div>
            <ChatList
              chats={chats}
              selectedChatId={selectedChatId}
              onSelectChat={handleSelectChat}
              isLoading={isChatsLoading}
            />
          </Card>

          {/* Активный чат */}
          <Card
            className={cn(
              "lg:col-span-8 flex flex-col overflow-hidden",
              !selectedChatId && "hidden lg:flex"
            )}
          >
            {selectedChat ? (
              <>
                <ChatHeader
                  chat={selectedChat}
                  onBack={() => setSelectedChatId(null)}
                />
                <MessageList
                  messages={[...allMessages].reverse()}
                  currentUserId={user?.id || ""}
                  isLoading={messagesQuery.isLoading}
                  hasMore={messagesQuery.hasNextPage}
                  onLoadMore={() => messagesQuery.fetchNextPage()}
                  isFetchingMore={messagesQuery.isFetchingNextPage}
                />
                <MessageInput
                  onSend={handleSendMessage}
                  disabled={sendMessageMutation.isPending}
                  messageCount={userMessagesCount}
                />
              </>
            ) : (
              <EmptyState type="select-chat" />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
