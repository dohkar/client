import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";
import type {
  Chat,
  Message,
  CreateListingChatRequest,
  SendMessageRequest,
  GetMessagesParams,
  MessagesResponse,
} from "@/types/chat";

/**
 * Сервис для работы с чатами
 * Готов к миграции на WebSocket
 */
export const chatsService = {
  async createListingChat(data: CreateListingChatRequest): Promise<Chat> {
    return apiClient.post<Chat>(API_ENDPOINTS.chats.createListing, data);
  },

  async createSupportChat(): Promise<Chat> {
    return apiClient.post<Chat>(API_ENDPOINTS.chats.createSupport);
  },

  async getChats(): Promise<Chat[]> {
    return apiClient.get<Chat[]>(API_ENDPOINTS.chats.list);
  },

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

  async sendMessage(chatId: string, data: SendMessageRequest): Promise<Message> {
    return apiClient.post<Message>(API_ENDPOINTS.chats.sendMessage(chatId), data);
  },

  async markMessagesAsRead(chatId: string): Promise<{ count: number }> {
    return apiClient.post<{ count: number }>(API_ENDPOINTS.chats.markRead(chatId));
  },
};
