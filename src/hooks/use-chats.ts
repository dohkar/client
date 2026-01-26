import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { queryKeys } from "@/lib/react-query/query-keys";
import { chatsService } from "@/services/chats.service";
import { useAuthStore } from "@/stores";
import { toast } from "sonner";
import type { Chat, Message, SendMessageRequest, MessagesResponse } from "@/types/chat";

/**
 * Адаптивный polling с Page Visibility API
 */
function useAdaptivePolling(interval: number, enabled: boolean = true) {
  const [isVisible, setIsVisible] = useState(
    typeof document !== "undefined" ? !document.hidden : true
  );

  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return {
    refetchInterval: enabled && isVisible ? interval : false,
    enabled: enabled && isVisible,
  };
}

/**
 * Хук для списка чатов с адаптивным polling (10 секунд)
 */
export function useChatsList() {
  const { refetchInterval } = useAdaptivePolling(10000); // 10 секунд

  return useQuery<Chat[]>({
    queryKey: queryKeys.chats.list(),
    queryFn: () => chatsService.getChats(),
    refetchInterval: refetchInterval as number | false,
    staleTime: 5000,
  });
}

/**
 * Хук для сообщений чата с cursor-based пагинацией и polling (5 секунд)
 */
export function useChatMessages(chatId: string | null, enabled: boolean = true) {
  const { refetchInterval } = useAdaptivePolling(5000, enabled && !!chatId); // 5 секунд

  return useInfiniteQuery<MessagesResponse, Error, MessagesResponse, readonly ["chats", "messages", string] | readonly ["chats", "messages", string, string], string | undefined>({
    queryKey: queryKeys.chats.messages(chatId || ""),
    queryFn: ({ pageParam }) =>
      chatsService.getChatMessages(chatId!, {
        cursor: pageParam,
        limit: 50,
      }),
    getNextPageParam: (lastPage: MessagesResponse) => lastPage.nextCursor || undefined,
    enabled: enabled && !!chatId,
    refetchInterval: refetchInterval as number | false,
    staleTime: 3000,
    initialPageParam: undefined as string | undefined,
    // Предотвращаем дубликаты при polling и удаляем временные сообщения
    structuralSharing: (oldData: any, newData: any) => {
      if (!oldData || !newData) return newData;
      if (!oldData.pages || !newData.pages) return newData;

      // Объединяем сообщения и удаляем дубликаты по ID
      // Также удаляем временные сообщения (они должны быть заменены реальными)
      const allMessages = new Map<string, Message>();
      
      // Сначала добавляем старые данные (без временных)
      oldData.pages.forEach((page: MessagesResponse) => {
        page.messages.forEach((msg) => {
          // Пропускаем временные сообщения
          if (!msg.id.startsWith("temp-")) {
            allMessages.set(msg.id, msg);
          }
        });
      });

      // Затем добавляем новые данные (они имеют приоритет)
      newData.pages.forEach((page: MessagesResponse) => {
        page.messages.forEach((msg) => {
          allMessages.set(msg.id, msg);
        });
      });

      // Создаем новую структуру без дубликатов
      const uniqueMessages = Array.from(allMessages.values());
      // Сортируем по времени создания (от старых к новым) для правильного отображения
      const sortedMessages = uniqueMessages.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      return {
        ...newData,
        pages: [
          {
            messages: sortedMessages,
            nextCursor: newData.pages[0]?.nextCursor || null,
            hasMore: newData.pages[0]?.hasMore || false,
          },
        ],
      };
    },
  });
}

/**
 * Хук для отправки сообщения с optimistic updates и debounce
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId, data }: { chatId: string; data: SendMessageRequest }) =>
      chatsService.sendMessage(chatId, data),

    onMutate: async ({ chatId, data }) => {
      // Отменяем исходящие запросы
      await queryClient.cancelQueries({
        queryKey: queryKeys.chats.messages(chatId),
      });

      // Сохраняем предыдущее состояние
      const previousMessages = queryClient.getQueryData(
        queryKeys.chats.messages(chatId)
      );

      // Получаем текущего пользователя из store
      const currentUser = useAuthStore.getState().user;

      // Optimistic update: добавляем временное сообщение
      queryClient.setQueryData<any>(queryKeys.chats.messages(chatId), (old: any) => {
        if (!old || !old.pages || old.pages.length === 0) return old;

        const tempMessage: Message = {
          id: `temp-${Date.now()}-${Math.random()}`,
          chatId,
          senderId: currentUser?.id || "current-user",
          text: data.text,
          isRead: false,
          readAt: null,
          createdAt: new Date(),
        };

        // Сообщения уже отсортированы от старых к новым (для отображения)
        // Добавляем новое сообщение в конец (самое свежее)
        const firstPage = old.pages[0];
        const updatedMessages = [...firstPage.messages, tempMessage];

        return {
          ...old,
          pages: [
            {
              ...firstPage,
              messages: updatedMessages,
            },
            ...old.pages.slice(1),
          ],
        };
      });

      return { previousMessages, tempMessageId: `temp-${Date.now()}` };
    },

    onError: (error, variables, context) => {
      // Откатываем к предыдущему состоянию
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.chats.messages(variables.chatId),
          context.previousMessages
        );
      }
      toast.error("Не удалось отправить сообщение");
    },

    onSuccess: (newMessage, variables, context) => {
      // Заменяем временное сообщение на реальное
      queryClient.setQueryData<any>(
        queryKeys.chats.messages(variables.chatId),
        (old: any) => {
          if (!old || !old.pages || old.pages.length === 0) {
            // Если нет данных, создаем новую структуру
            return {
              pages: [
                {
                  messages: [newMessage],
                  nextCursor: null,
                  hasMore: false,
                },
              ],
              pageParams: [undefined],
            };
          }

          // Удаляем все временные сообщения и добавляем реальное
          const updatedPages = old.pages.map((page: MessagesResponse, index: number) => {
            if (index === 0) {
              // В первой странице удаляем временные сообщения
              const messagesWithoutTemp = page.messages.filter(
                (msg) => !msg.id.startsWith("temp-")
              );
              
              // Проверяем, нет ли уже этого сообщения (по ID или тексту + времени)
              const messageExists = messagesWithoutTemp.some(
                (msg) =>
                  msg.id === newMessage.id ||
                  (msg.text === newMessage.text &&
                    Math.abs(
                      new Date(msg.createdAt).getTime() -
                      new Date(newMessage.createdAt).getTime()
                    ) < 5000) // 5 секунд разница
              );

              if (!messageExists) {
                // Добавляем новое сообщение в конец (самое свежее, так как массив отсортирован от старых к новым)
                return {
                  ...page,
                  messages: [...messagesWithoutTemp, newMessage],
                };
              }

              // Если сообщение уже есть, просто удаляем временные
              return {
                ...page,
                messages: messagesWithoutTemp,
              };
            }
            return page;
          });

          return {
            ...old,
            pages: updatedPages,
          };
        }
      );

      // Обновляем список чатов (lastMessage)
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.list() });
    },

    onSettled: (data, error, variables) => {
      // Синхронизируем с сервером только если была ошибка
      if (error) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.chats.messages(variables.chatId),
        });
      }
    },
  });
}

/**
 * Хук для пометки сообщений как прочитанных
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (chatId: string) => chatsService.markMessagesAsRead(chatId),

    onSuccess: (data, chatId) => {
      // Обновляем сообщения в чате
      queryClient.invalidateQueries({
        queryKey: queryKeys.chats.messages(chatId),
      });

      // Обновляем список чатов (unreadCount)
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.list() });
    },

    onError: () => {
      toast.error("Не удалось пометить сообщения как прочитанные");
    },
  });
}

/**
 * Хук для создания чата по объявлению
 */
export function useCreatePropertyChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (propertyId: string) =>
      chatsService.createPropertyChat({ propertyId }),

    onSuccess: () => {
      // Обновляем список чатов
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.list() });
    },

    onError: (error: any) => {
      if (error.message?.includes("своим объявлением")) {
        toast.error("Вы не можете создать чат со своим объявлением");
      } else {
        toast.error("Не удалось создать чат");
      }
    },
  });
}

/**
 * Хук для создания или получения чата поддержки
 */
export function useSupportChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => chatsService.createSupportChat(),

    onSuccess: () => {
      // Обновляем список чатов
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.list() });
    },

    onError: () => {
      toast.error("Не удалось открыть чат поддержки");
    },
  });
}
