"use client";

import { io, Socket } from "socket.io-client";
import type { Message } from "@/types/chat";
import { logger } from "@/lib/utils/logger";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type SocketEventMap = {
  // Присоединение/выход
  "chat:join": { chatId: string };
  "chat:leave": { chatId: string };

  // Сообщения
  "message:send": {
    chatId: string;
    text: string;
    clientMessageId: string;
  };
  "message:new": Message & { chatId: string };
  "message:read": {
    chatId: string;
    userId: string;
    readAt: Date;
  };

  // Обновление чата
  "chat:updated": {
    chatId: string;
    lastMessageAt?: Date;
    lastMessageText?: string;
    unreadCount?: number;
  };

  // Типинг
  "typing:start": { chatId: string; userId: string };
  "typing:stop": { chatId: string; userId: string };

  // Присутствие
  "presence:online": { chatId: string; userId: string; timestamp: Date; isOnline: true };
  "presence:offline": {
    chatId: string;
    userId: string;
    timestamp: Date;
    isOnline: false;
  };
};

export type TypingOutboundPayload = { chatId: string; isTyping: boolean };

export type SocketAck<T = string | Message> = {
  status: "success" | "error";
  message?: T;
  count?: number;
};

class SocketClient {
  private socket: Socket | null = null;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 1000;

  /**
   * Подключение к WebSocket серверу. Без токена не подключаемся (меньше шума в консоли).
   */
  connect(token?: string): Socket | null {
    const normalizedToken = token && token.trim() ? token.trim() : null;
    if (!normalizedToken) {
      this.disconnect();
      return null;
    }
    if (this.socket?.connected && this.token === normalizedToken) {
      return this.socket;
    }

    if (this.socket && this.token !== normalizedToken) {
      this.disconnect();
    }

    this.token = normalizedToken;

    this.socket = io(`${SOCKET_URL}/chats`, {
      auth: { token: normalizedToken },
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();

    return this.socket;
  }

  /**
   * Настройка базовых слушателей событий
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      logger.debug("[WS] Connected to server");
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      logger.debug("[WS] Disconnected:", reason);
    });

    this.socket.on("connect_error", (error: Error & { data?: { code?: number } }) => {
      const msg = error.message || "";
      const isAuthError =
        error.data?.code === 401 ||
        error.data?.code === 403 ||
        /unauthorized|forbidden|not authorized|401|403/i.test(msg);
      if (isAuthError) {
        logger.warn("[WS] Auth error (401/Unauthorized), disconnecting");
        this.disconnect();
        return;
      }
      logger.error("[WS] Connection error:", msg);

      this.reconnectAttempts++;

      // Экспоненциальный backoff
      const delay = Math.min(
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
        10000
      );
      logger.debug(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    });

    this.socket.on("reconnect", (attemptNumber) => {
      logger.debug("[WS] Reconnected after", attemptNumber, "attempts");
      this.reconnectAttempts = 0;
    });

    this.socket.on("reconnect_failed", () => {
      logger.error(
        "[WS] Reconnection failed after",
        this.maxReconnectAttempts,
        "attempts"
      );
      this.disconnect();
    });
  }

  /**
   * Отключение от сервера
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.token = null;
    }
  }

  /**
   * Проверка подключения
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Получить сокет (для использования в хуках)
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Присоединиться к комнате чата
   */
  joinChat(chatId: string, callback?: (ack: SocketAck) => void): void {
    if (!this.socket) return;

    this.socket.emit("chat:join", { chatId }, callback);
  }

  /**
   * Покинуть комнату чата
   */
  leaveChat(chatId: string, callback?: (ack: SocketAck) => void): void {
    if (!this.socket) return;

    this.socket.emit("chat:leave", { chatId }, callback);
  }

  /**
   * Отправить сообщение (с ACK)
   */
  sendMessage(
    chatId: string,
    text: string,
    clientMessageId: string,
    callback?: (ack: SocketAck<Message | string>) => void
  ): void {
    if (!this.socket) {
      callback?.({
        status: "error",
        message: "Socket not connected",
      });
      return;
    }

    this.socket.emit(
      "message:send",
      {
        chatId,
        text,
        clientMessageId,
      },
      callback
    );
  }

  /**
   * Пометить сообщения как прочитанные
   */
  markAsRead(chatId: string, callback?: (ack: SocketAck) => void): void {
    if (!this.socket) return;

    this.socket.emit("message:read", { chatId }, callback);
  }

  /**
   * Индикатор печати
   */
  sendTyping(chatId: string, isTyping: boolean): void {
    if (!this.socket) return;

    const event = isTyping ? "typing:start" : "typing:stop";
    const payload: TypingOutboundPayload = { chatId, isTyping };
    this.socket.emit(event, payload);
  }

  /**
   * Подписка на событие
   */
  on<K extends keyof SocketEventMap>(
    event: K,
    callback: (data: SocketEventMap[K]) => void
  ): void {
    if (!this.socket) return;

    this.socket.on(event as string, callback as any);
  }

  /**
   * Отписка от события
   */
  off<K extends keyof SocketEventMap>(
    event: K,
    callback?: (data: SocketEventMap[K]) => void
  ): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event as string, callback as any);
    } else {
      this.socket.off(event as string);
    }
  }
}

// Singleton instance
export const socketClient = new SocketClient();
