import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";
import type {
  Chat,
  Message,
  CreatePropertyChatRequest,
  SendMessageRequest,
  GetMessagesParams,
  MessagesResponse,
} from "@/types/chat";

/**
 * Сервис для работы с чатами
 * Готов к миграции на WebSocket
 */
export const chatsService = {
  /**
   * Создать или получить чат по объявлению
   */
  async createPropertyChat(data: CreatePropertyChatRequest): Promise<Chat> {
    return apiClient.post<Chat>(API_ENDPOINTS.chats.createProperty, data);
  },

  /**
   * Создать или получить чат поддержки
   */
  async createSupportChat(): Promise<Chat> {
    return apiClient.post<Chat>(API_ENDPOINTS.chats.createSupport);
  },

  /**
   * Получить список чатов пользователя
   */
  async getChats(): Promise<Chat[]> {
    return apiClient.get<Chat[]>(API_ENDPOINTS.chats.list);
  },

  /**
   * Получить сообщения чата с cursor pagination
   */
  async getChatMessages(
    chatId: string,
    params?: GetMessagesParams
  ): Promise<MessagesResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.cursor) {
      queryParams.append("cursor", params.cursor);
    }
    if (params?.limit) {
      queryParams.append("limit", params.limit.toString());
    }

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.chats.messages(chatId)}?${queryString}`
      : API_ENDPOINTS.chats.messages(chatId);

    return apiClient.get<MessagesResponse>(endpoint);
  },

  /**
   * Отправить сообщение
   */
  async sendMessage(
    chatId: string,
    data: SendMessageRequest
  ): Promise<Message> {
    return apiClient.post<Message>(
      API_ENDPOINTS.chats.sendMessage(chatId),
      data
    );
  },

  /**
   * Пометить все сообщения как прочитанные
   */
  async markMessagesAsRead(chatId: string): Promise<{ count: number }> {
    return apiClient.post<{ count: number }>(
      API_ENDPOINTS.chats.markRead(chatId)
    );
  },

  // Место для будущей WS интеграции
  // connectWebSocket?: () => void;
  // disconnectWebSocket?: () => void;
  // onNewMessage?: (callback: (message: Message) => void) => void;
};
