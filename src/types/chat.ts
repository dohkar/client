/**
 * Типы для системы чатов
 */

export enum ChatType {
  PROPERTY = "PROPERTY",
  SUPPORT = "SUPPORT",
}

export enum ChatParticipantRole {
  BUYER = "BUYER",
  SELLER = "SELLER",
  SUPPORT = "SUPPORT",
}

export interface ChatParticipant {
  id: string;
  userId: string;
  role: ChatParticipantRole;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface Chat {
  id: string;
  type: ChatType;
  propertyId: string | null;
  isArchived: boolean;
  lastMessageAt: Date | null;
  lastMessageText: string | null;
  createdAt: Date;
  participants: ChatParticipant[];
  unreadCount: number;
  property?: {
    id: string;
    title: string;
    price: number;
    images: string[];
  };
}

export interface CreatePropertyChatRequest {
  propertyId: string;
}

export interface SendMessageRequest {
  text: string;
}

export interface GetMessagesParams {
  cursor?: string;
  limit?: number;
}

export interface MessagesResponse {
  messages: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}
