import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { queryKeys } from "@/lib/react-query/query-keys";
import { chatsService } from "@/services/chats.service";
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

      // Optimistic update: добавляем временное сообщение
      queryClient.setQueryData<any>(queryKeys.chats.messages(chatId), (old: any) => {
        if (!old) return old;

        const tempMessage: Message = {
          id: `temp-${Date.now()}`,
          chatId,
          senderId: "current-user", // Будет заменено реальным ID
          text: data.text,
          isRead: false,
          readAt: null,
          createdAt: new Date(),
        };

        return {
          ...old,
          pages: [
            {
              ...old.pages[0],
              messages: [tempMessage, ...old.pages[0].messages],
            },
            ...old.pages.slice(1),
          ],
        };
      });

      return { previousMessages };
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

    onSuccess: (data, variables) => {
      // Обновляем список чатов (lastMessage)
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.list() });
    },

    onSettled: (data, error, variables) => {
      // Синхронизируем с сервером
      queryClient.invalidateQueries({
        queryKey: queryKeys.chats.messages(variables.chatId),
      });
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
