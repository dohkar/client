"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChatsList, useChatMessages, useSendMessage, useMarkAsRead } from "@/hooks/use-chats";
import { useAuthStore } from "@/stores";
import { ChatList, ChatHeader, MessageList, MessageInput, EmptyState } from "@/components/features/chats";
import { useNotifications } from "@/components/features/chats/hooks/use-notifications";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import type { Message, MessagesResponse } from "@/types/chat";
import type { InfiniteData } from "@tanstack/react-query";

function MessagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);

  // Получаем chatId из query параметров
  const chatIdFromQuery = searchParams.get("chatId");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    chatIdFromQuery || null
  );

  // Получаем список чатов
  const { data: chats = [], isLoading: isChatsLoading } = useChatsList();

  // Устанавливаем выбранный чат из query параметров после загрузки чатов
  useEffect(() => {
    if (chatIdFromQuery && chats.length > 0 && !selectedChatId) {
      const chatExists = chats.some((chat) => chat.id === chatIdFromQuery);
      if (chatExists) {
        setSelectedChatId(chatIdFromQuery);
        // Очищаем query параметр после установки
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("chatId");
        router.replace(newUrl.pathname + newUrl.search, { scroll: false });
      }
    }
  }, [chatIdFromQuery, chats, router, selectedChatId]);

  // Получаем сообщения активного чата
  const messagesQuery = useChatMessages(selectedChatId, !!selectedChatId);

  // Мутации
  const sendMessageMutation = useSendMessage();
  const markAsReadMutation = useMarkAsRead();

  // Notifications
  const { requestPermission, showNotification, permission } = useNotifications();

  // Редирект если не авторизован (только после инициализации)
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, isInitialized, router]);

  // Автоматическая пометка как прочитанное при открытии чата (с debounce)
  useEffect(() => {
    if (!selectedChatId || document.hidden) return;

    const timeoutId = setTimeout(() => {
      markAsReadMutation.mutate(selectedChatId);
    }, 500); // Debounce 500ms

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Объединяем все страницы сообщений и удаляем дубликаты
  const allMessages: Message[] = useMemo(() => {
    const pages = (messagesQuery.data as InfiniteData<MessagesResponse> | undefined)?.pages || [];
    const messages = pages.flatMap((page) => page.messages);

    // Удаляем дубликаты по ID (приоритет у реальных сообщений)
    const uniqueMessages = new Map<string, Message>();
    messages.forEach((msg) => {
      // Пропускаем временные сообщения, если есть реальное с таким же текстом и временем
      if (msg.id.startsWith("temp-")) {
        const realMessageExists = messages.some(
          (m) =>
            !m.id.startsWith("temp-") &&
            m.text === msg.text &&
            Math.abs(
              new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()
            ) < 5000
        );
        if (!realMessageExists) {
          uniqueMessages.set(msg.id, msg);
        }
      } else {
        // Реальные сообщения имеют приоритет
        if (!uniqueMessages.has(msg.id)) {
          uniqueMessages.set(msg.id, msg);
        }
      }
    });

    // Сортируем по времени (от старых к новым) для правильного отображения
    const sorted = Array.from(uniqueMessages.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return sorted;
  }, [messagesQuery.data]);

  // Находим выбранный чат
  const selectedChat = chats.find((chat) => chat.id === selectedChatId);

  // Подсчет сообщений от текущего пользователя (для валидации)
  const userMessagesCount = allMessages.filter(
    (msg) => msg.senderId === user?.id
  ).length;

  // Проверка на спам в support-чате (3 сообщения подряд без ответа)
  const showSpamHint = useMemo(() => {
    if (!selectedChat || selectedChat.type !== "SUPPORT" || !user?.id) {
      return false;
    }

    // Берем последние 3 сообщения
    const lastThreeMessages = allMessages.slice(-3);
    
    // Проверяем, что все 3 последних сообщения от пользователя
    if (lastThreeMessages.length < 3) {
      return false;
    }

    const allFromUser = lastThreeMessages.every((msg) => msg.senderId === user.id);
    
    // Проверяем, что перед этими 3 сообщениями нет ответа от поддержки
    if (allFromUser && allMessages.length > 3) {
      const messageBeforeLastThree = allMessages[allMessages.length - 4];
      // Если перед последними 3 сообщениями есть сообщение не от пользователя - не спам
      if (messageBeforeLastThree && messageBeforeLastThree.senderId !== user.id) {
        return false;
      }
    }

    return allFromUser;
  }, [allMessages, selectedChat, user?.id]);

  // Обработка уведомлений при новых сообщениях
  useEffect(() => {
    if (!selectedChatId || !user?.id || document.hidden) return;

    const lastMessage = allMessages[allMessages.length - 1];
    if (
      lastMessage &&
      lastMessage.senderId !== user.id &&
      !lastMessage.isRead
    ) {
      showNotification(
        "Новое сообщение",
        lastMessage.text.substring(0, 50) + (lastMessage.text.length > 50 ? "..." : "")
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMessages.length, selectedChatId, user?.id, showNotification]);

  // Показываем loading пока идет инициализация
  if (!isInitialized || isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="h-8 w-64" />
      </div>
    );
  }

  // Редирект если не авторизован
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
                  messages={allMessages}
                  currentUserId={user?.id || ""}
                  isLoading={messagesQuery.isLoading}
                  hasMore={messagesQuery.hasNextPage}
                  onLoadMore={() => messagesQuery.fetchNextPage()}
                  isFetchingMore={messagesQuery.isFetchingNextPage}
                  chatType={selectedChat.type}
                />
                <MessageInput
                  onSend={handleSendMessage}
                  disabled={sendMessageMutation.isPending}
                  messageCount={userMessagesCount}
                  chatType={selectedChat.type}
                  showSpamHint={showSpamHint}
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

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Skeleton className="h-8 w-64" />
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}
