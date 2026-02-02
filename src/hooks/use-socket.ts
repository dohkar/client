"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  socketClient,
  type SocketEventMap,
  type SocketAck,
} from "@/lib/socket/socket-client";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useAuthStore } from "@/stores";
import { accessTokenStorage } from "@/lib/access-token-storage";
import type { Message, Chat, MessagesResponse } from "@/types/chat";
import { logger } from "@/lib/utils/logger";

/**
 * Хук для работы с WebSocket подключением
 * Передаём JWT в handshake (auth.token), т.к. при cross-origin (Vercel → Render)
 * cookies фронта не отправляются на WebSocket.
 */
export function useSocket() {
  const { user, isAuthenticated } = useAuthStore();
  const [, forceUpdate] = useState(0);

  const token =
    typeof window === "undefined" ? null : accessTokenStorage.getAccessToken();
  const isWsReady = Boolean(isAuthenticated && user && token);

  useEffect(() => {
    if (!isWsReady) {
      socketClient.disconnect();
      return;
    }
    const socket = socketClient.connect(token ?? undefined);
    if (!socket) return;

    const handleConnect = () => {
      logger.debug("[useSocket] Connected");
      forceUpdate((x) => x + 1);
    };

    const handleDisconnect = () => {
      logger.debug("[useSocket] Disconnected");
      forceUpdate((x) => x + 1);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [isWsReady, token]);

  const socket = socketClient.getSocket();
  const isConnected = isWsReady && socketClient.isConnected();
  const isConnecting = isWsReady && Boolean(socket) && !socketClient.isConnected();

  return {
    isConnected,
    isConnecting,
    useFallback: !isWsReady || !socket || !isConnected,
    socket: socketClient.getSocket(),
  };
}

/**
 * Хук для real-time обновлений чатов
 */
export function useChatRealtimeUpdates(enabled: boolean = true) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { isConnected } = useSocket();

  useEffect(() => {
    if (!enabled || !isConnected || !user) return;

    const handleChatUpdated = (data: SocketEventMap["chat:updated"]) => {
      // Обновляем список чатов
      queryClient.setQueryData<Chat[]>(queryKeys.chats.list(), (oldChats) => {
        if (!oldChats) return oldChats;

        return oldChats.map((chat) => {
          if (chat.id === data.chatId) {
            return {
              ...chat,
              ...(data.lastMessageAt && { lastMessageAt: data.lastMessageAt }),
              ...(data.lastMessageText && { lastMessageText: data.lastMessageText }),
              ...(data.unreadCount !== undefined && { unreadCount: data.unreadCount }),
            };
          }
          return chat;
        });
      });
    };

    socketClient.on("chat:updated", handleChatUpdated);

    return () => {
      socketClient.off("chat:updated", handleChatUpdated);
    };
  }, [enabled, isConnected, user, queryClient]);
}

/**
 * Хук для real-time обновлений сообщений в чате
 */
export function useMessagesRealtimeUpdates(
  chatId: string | null,
  enabled: boolean = true
) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { isConnected } = useSocket();
  const hasJoined = useRef(false);

  // Присоединение/выход из комнаты чата
  useEffect(() => {
    if (!enabled || !isConnected || !chatId || !user) {
      hasJoined.current = false;
      return;
    }

    socketClient.joinChat(chatId, (ack) => {
      if (ack.status === "success") {
        logger.debug(`[useMessagesRealtimeUpdates] Joined chat ${chatId}`);
        hasJoined.current = true;
      } else {
        logger.error(`[useMessagesRealtimeUpdates] Failed to join chat:`, ack.message);
      }
    });

    return () => {
      if (hasJoined.current) {
        socketClient.leaveChat(chatId);
        hasJoined.current = false;
      }
    };
  }, [enabled, isConnected, chatId, user]);

  // Обработка новых сообщений
  useEffect(() => {
    if (!enabled || !isConnected || !chatId || !user) return;

    const handleNewMessage = (data: SocketEventMap["message:new"]) => {
      if (data.chatId !== chatId) return;

      queryClient.setQueryData<{
        pages: MessagesResponse[];
        pageParams: (string | undefined)[];
      }>(queryKeys.chats.messages(chatId), (oldData) => {
        if (!oldData) return oldData;

        // Проверяем, не существует ли уже это сообщение
        const messageExists = oldData.pages.some((page) =>
          page.messages.some((msg) => msg.id === data.id)
        );

        if (messageExists) {
          return oldData;
        }

        // Удаляем временное сообщение с тем же clientMessageId (если есть)
        const updatedPages = oldData.pages.map((page) => ({
          ...page,
          messages: page.messages.filter(
            (msg) =>
              !msg.id.startsWith("temp-") ||
              !msg.clientMessageId ||
              msg.clientMessageId !== data.clientMessageId
          ),
        }));

        // Добавляем новое сообщение в первую страницу (самые новые сообщения)
        return {
          ...oldData,
          pages: updatedPages.map((page, idx) =>
            idx === 0 ? { ...page, messages: [...page.messages, data] } : page
          ),
        };
      });

      // Обновляем список чатов (lastMessage)
      queryClient.setQueryData<Chat[]>(queryKeys.chats.list(), (oldChats) => {
        if (!oldChats) return oldChats;

        return oldChats.map((chat) => {
          if (chat.id === chatId) {
            return {
              ...chat,
              lastMessageAt: data.createdAt,
              lastMessageText: data.text,
              // Не увеличиваем unread для активного чата (пользователь его просматривает, mark-as-read по WS)
              unreadCount: chat.unreadCount,
            };
          }
          return chat;
        });
      });
    };

    const handleMessageRead = (data: SocketEventMap["message:read"]) => {
      if (data.chatId !== chatId) return;

      // Помечаем как прочитанные сообщения, которые прочитал пользователь data.userId (сообщения не от него)
      queryClient.setQueryData<{
        pages: MessagesResponse[];
        pageParams: (string | undefined)[];
      }>(queryKeys.chats.messages(chatId), (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            messages: page.messages.map((msg) =>
              msg.senderId !== data.userId && !msg.isRead
                ? { ...msg, isRead: true, readAt: data.readAt }
                : msg
            ),
          })),
        };
      });
    };

    socketClient.on("message:new", handleNewMessage);
    socketClient.on("message:read", handleMessageRead);

    return () => {
      socketClient.off("message:new", handleNewMessage);
      socketClient.off("message:read", handleMessageRead);
    };
  }, [enabled, isConnected, chatId, user, queryClient]);
}

/**
 * Real-time typing + presence (online/offline) для активного чата
 */
export function useChatTypingAndPresence(chatId: string | null, enabled: boolean = true) {
  const { user } = useAuthStore();
  const { isConnected } = useSocket();
  const [typingUserIds, setTypingUserIds] = useState<Set<string>>(new Set());
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const typingTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if (!enabled || !isConnected || !chatId || !user?.id) return;

    const clearTypingTimeout = (userId: string) => {
      const t = typingTimeoutsRef.current.get(userId);
      if (t) clearTimeout(t);
      typingTimeoutsRef.current.delete(userId);
    };

    const markTyping = (userId: string) => {
      if (userId === user.id) return;
      clearTypingTimeout(userId);
      setTypingUserIds((prev) => new Set(prev).add(userId));
      const timeout = setTimeout(() => {
        setTypingUserIds((prev) => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
        clearTypingTimeout(userId);
      }, 3000);
      typingTimeoutsRef.current.set(userId, timeout);
    };

    const unmarkTyping = (userId: string) => {
      if (userId === user.id) return;
      clearTypingTimeout(userId);
      setTypingUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    const handleTypingStart = (data: SocketEventMap["typing:start"]) => {
      if (data.chatId !== chatId) return;
      markTyping(data.userId);
    };

    const handleTypingStop = (data: SocketEventMap["typing:stop"]) => {
      if (data.chatId !== chatId) return;
      unmarkTyping(data.userId);
    };

    const handlePresenceOnline = (data: SocketEventMap["presence:online"]) => {
      if (data.chatId !== chatId) return;
      if (data.userId === user.id) return;
      setOnlineUserIds((prev) => new Set(prev).add(data.userId));
    };

    const handlePresenceOffline = (data: SocketEventMap["presence:offline"]) => {
      if (data.chatId !== chatId) return;
      if (data.userId === user.id) return;
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(data.userId);
        return next;
      });
    };

    socketClient.on("typing:start", handleTypingStart);
    socketClient.on("typing:stop", handleTypingStop);
    socketClient.on("presence:online", handlePresenceOnline);
    socketClient.on("presence:offline", handlePresenceOffline);

    return () => {
      socketClient.off("typing:start", handleTypingStart);
      socketClient.off("typing:stop", handleTypingStop);
      socketClient.off("presence:online", handlePresenceOnline);
      socketClient.off("presence:offline", handlePresenceOffline);
      // cleanup timeouts
      for (const t of typingTimeoutsRef.current.values()) clearTimeout(t);
      typingTimeoutsRef.current.clear();
    };
  }, [enabled, isConnected, chatId, user?.id]);

  return {
    typingUserIds,
    onlineUserIds,
  };
}

const ACK_TIMEOUT_MS = 10000;

function isMessageAck(
  ack: SocketAck<Message | string>
): ack is SocketAck<Message> & { status: "success"; message: Message } {
  return (
    ack.status === "success" && ack.message != null && typeof ack.message !== "string"
  );
}

function rollbackTempMessage(
  queryClient: ReturnType<typeof useQueryClient>,
  chatId: string,
  tempMessageId: string,
  clientMessageId: string
) {
  queryClient.setQueryData<{
    pages: MessagesResponse[];
    pageParams: (string | undefined)[];
  }>(queryKeys.chats.messages(chatId), (oldData) => {
    if (!oldData) return oldData;
    return {
      ...oldData,
      pages: oldData.pages.map((page) => ({
        ...page,
        messages: page.messages.filter(
          (msg) => msg.id !== tempMessageId && msg.clientMessageId !== clientMessageId
        ),
      })),
    };
  });
}

/**
 * Хук для отправки сообщений через WebSocket
 */
export function useSendMessageWs() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { isConnected, useFallback } = useSocket();
  const pendingAcksRef = useRef<
    Map<
      string,
      {
        timeoutId: ReturnType<typeof setTimeout>;
        chatId: string;
        clientMessageId: string;
        tempMessageId: string;
        reject: (err: Error) => void;
      }
    >
  >(new Map());

  useEffect(() => {
    return () => {
      pendingAcksRef.current.forEach((entry) => {
        clearTimeout(entry.timeoutId);
        rollbackTempMessage(
          queryClient,
          entry.chatId,
          entry.tempMessageId,
          entry.clientMessageId
        );
        entry.reject(new Error("Unmount: ACK cancelled"));
      });
      pendingAcksRef.current.clear();
    };
  }, [queryClient]);

  const sendMessage = useCallback(
    (chatId: string, text: string, clientMessageId: string): Promise<Message> => {
      return new Promise((resolve, reject) => {
        if (useFallback || !isConnected || !chatId || !user) {
          reject(new Error("Not connected or chat not selected"));
          return;
        }

        // Добавляем оптимистичное сообщение
        const tempMessage: Message = {
          id: `temp-${clientMessageId}`,
          chatId,
          senderId: user.id,
          text,
          isRead: false,
          readAt: null,
          createdAt: new Date(),
          deletedAt: null,
          sender: {
            id: user.id,
            name: user.name || "Вы",
            avatar: user.avatar || null,
          },
          clientMessageId,
        } as Message & { clientMessageId: string };

        queryClient.setQueryData<{
          pages: MessagesResponse[];
          pageParams: (string | undefined)[];
        }>(queryKeys.chats.messages(chatId), (oldData) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            pages: oldData.pages.map((p, idx) =>
              idx === 0 ? { ...p, messages: [...p.messages, tempMessage] } : p
            ),
          };
        });

        const clearPending = () => {
          const entry = pendingAcksRef.current.get(clientMessageId);
          if (entry) {
            clearTimeout(entry.timeoutId);
            pendingAcksRef.current.delete(clientMessageId);
          }
        };

        const timeoutId = setTimeout(() => {
          clearPending();
          rollbackTempMessage(queryClient, chatId, tempMessage.id, clientMessageId);
          reject(new Error("ACK timeout"));
        }, ACK_TIMEOUT_MS);

        pendingAcksRef.current.set(clientMessageId, {
          timeoutId,
          chatId,
          clientMessageId,
          tempMessageId: tempMessage.id,
          reject,
        });

        // Отправляем через WebSocket
        socketClient.sendMessage(chatId, text, clientMessageId, (ack) => {
          clearPending();

          if (
            ack.status === "success" &&
            ack.message &&
            typeof ack.message !== "string"
          ) {
            const saved = ack.message as Message;

            // Сразу заменяем temp на сохранённое сообщение (не ждём message:new),
            // чтобы UI не "ощущался polling".
            queryClient.setQueryData<{
              pages: MessagesResponse[];
              pageParams: (string | undefined)[];
            }>(queryKeys.chats.messages(chatId), (oldData) => {
              if (!oldData) return oldData;
              return {
                ...oldData,
                pages: oldData.pages.map((page) => ({
                  ...page,
                  messages: page.messages.map((m) =>
                    m.id === tempMessage.id || m.clientMessageId === clientMessageId
                      ? saved
                      : m
                  ),
                })),
              };
            });

            // Обновляем lastMessage в списке чатов локально
            queryClient.setQueryData<Chat[]>(queryKeys.chats.list(), (oldChats) => {
              if (!oldChats) return oldChats;
              return oldChats.map((c) =>
                c.id === chatId
                  ? {
                      ...c,
                      lastMessageAt: saved.createdAt,
                      lastMessageText: saved.text,
                    }
                  : c
              );
            });

            resolve(saved);
          } else {
            rollbackTempMessage(queryClient, chatId, tempMessage.id, clientMessageId);
            reject(
              new Error(
                typeof ack.message === "string" ? ack.message : "Failed to send message"
              )
            );
          }
        });
      });
    },
    [user, useFallback, isConnected, queryClient]
  );

  return {
    sendMessage,
    isConnected: !useFallback && isConnected,
  };
}
