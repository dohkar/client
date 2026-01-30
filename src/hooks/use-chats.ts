import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { queryKeys } from "@/lib/react-query/query-keys";
import { chatsService } from "@/services/chats.service";
import { toast } from "sonner";
import { useAuthStore } from "@/stores";
import type { Chat, Message, SendMessageRequest, MessagesResponse } from "@/types/chat";
import {
  useSocket,
  useChatRealtimeUpdates,
  useMessagesRealtimeUpdates,
  useSendMessageWs,
} from "./use-socket";
import { logger } from "@/lib/utils/logger";
import { socketClient } from "@/lib/socket/socket-client";

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
 * Хук для списка чатов с WebSocket real-time + fallback на polling
 */
export function useChatsList() {
  const { useFallback } = useSocket();
  const { refetchInterval } = useAdaptivePolling(10000); // 10 секунд

  // Включаем WebSocket обновления
  useChatRealtimeUpdates(!useFallback);

  return useQuery<Chat[]>({
    queryKey: queryKeys.chats.list(),
    queryFn: () => chatsService.getChats(),
    // Polling только если WebSocket недоступен
    refetchInterval: useFallback ? (refetchInterval as number | false) : false,
    staleTime: 5000,
  });
}

/**
 * Хук для сообщений чата с WebSocket real-time + fallback на polling
 */
export function useChatMessages(chatId: string | null, enabled: boolean = true) {
  const { useFallback } = useSocket();
  const { refetchInterval } = useAdaptivePolling(5000, enabled && !!chatId); // 5 секунд

  // Включаем WebSocket обновления для сообщений
  useMessagesRealtimeUpdates(chatId, enabled && !useFallback);

  return useInfiniteQuery<
    MessagesResponse,
    Error,
    MessagesResponse,
    | readonly ["chats", "messages", string]
    | readonly ["chats", "messages", string, string],
    string | undefined
  >({
    queryKey: queryKeys.chats.messages(chatId || ""),
    queryFn: ({ pageParam }) =>
      chatsService.getChatMessages(chatId!, {
        cursor: pageParam,
        limit: 50,
      }),
    getNextPageParam: (lastPage: MessagesResponse) => lastPage.nextCursor || undefined,
    enabled: enabled && !!chatId,
    // Polling только если WebSocket недоступен
    refetchInterval: useFallback ? (refetchInterval as number | false) : false,
    staleTime: 3000,
    initialPageParam: undefined as string | undefined,
  });
}

/**
 * Хук для отправки сообщения через WebSocket с fallback на REST
 */
export function useSendMessage() {
  const { useFallback } = useSocket();
  const { sendMessage: sendMessageWs, isConnected } = useSendMessageWs();

  return useMutation({
    mutationFn: async ({
      chatId,
      data,
    }: {
      chatId: string;
      data: SendMessageRequest;
    }) => {
      // Генерируем clientMessageId для идемпотентности (UUID v4),
      // чтобы проходить server-side @IsUUID() в WsSendMessageDto.
      const clientMessageId = (() => {
        if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
          return crypto.randomUUID();
        }

        // Fallback: UUID v4 from crypto.getRandomValues (без внешних зависимостей)
        const cryptoObj = (globalThis as unknown as { crypto?: Crypto }).crypto;
        if (cryptoObj?.getRandomValues) {
          const bytes = new Uint8Array(16);
          cryptoObj.getRandomValues(bytes);
          // version 4
          bytes[6] = (bytes[6] & 0x0f) | 0x40;
          // variant 10xx
          bytes[8] = (bytes[8] & 0x3f) | 0x80;

          const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
          return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex
            .slice(6, 8)
            .join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
        }

        // Самый последний fallback (теоретически): сохраняем уникальность, но UUID не гарантируем
        // (на практике в современных браузерах crypto.getRandomValues есть).
        return `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random()
          .toString(16)
          .slice(2)}`;
      })();

      // Если WebSocket доступен, используем его
      if (!useFallback && isConnected) {
        try {
          return await sendMessageWs(chatId, data.text, clientMessageId);
        } catch (error) {
          logger.error("[useSendMessage] WS failed, falling back to REST:", error);
          // Fallback на REST
          return chatsService.sendMessage(chatId, data);
        }
      }

      // Иначе используем REST
      return chatsService.sendMessage(chatId, data);
    },
    onError: () => {
      toast.error("Не удалось отправить сообщение");
    },
  });
}

/**
 * Хук для пометки сообщений как прочитанных
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();
  const { useFallback, isConnected } = useSocket();

  return useMutation({
    mutationFn: async (chatId: string) => {
      if (!useFallback && isConnected) {
        // WS mark-as-read with ACK
        return await new Promise<{ count: number }>((resolve, reject) => {
          socketClient.markAsRead(chatId, (ack) => {
            if (ack.status === "success") {
              resolve({ count: typeof ack.count === "number" ? ack.count : 0 });
            } else {
              reject(new Error(typeof ack.message === "string" ? ack.message : "Failed"));
            }
          });
        });
      }

      return chatsService.markMessagesAsRead(chatId);
    },

    onSuccess: (_data, chatId) => {
      // Обновляем только список чатов (unreadCount: 0). Сообщения обновляет обработчик message:read по WS.
      queryClient.setQueryData<Chat[]>(queryKeys.chats.list(), (oldChats) => {
        if (!oldChats) return oldChats;
        return oldChats.map((c) =>
          c.id === chatId ? { ...c, unreadCount: 0 } : c
        );
      });
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
    mutationFn: (propertyId: string) => chatsService.createPropertyChat({ propertyId }),

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
