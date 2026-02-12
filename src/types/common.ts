/**
 * Базовый тип ответа API
 */
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  status: "success" | "error";
}

/**
 * Тип ошибки API
 */
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

/**
 * Расширенный тип ошибки с дополнительными свойствами
 */
export interface ExtendedError extends Error {
  status?: number;
  code?: string;
}

/**
 * Тип для ошибок сети
 */
export interface NetworkError extends Error {
  code?: string;
  cause?: unknown;
}

/**
 * Параметры пагинации
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Ответ с пагинацией
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Статус загрузки
 */
export type LoadingState = "idle" | "loading" | "success" | "error";

/**
 * Тип сделки
 */
export type DealType = "buy" | "rent" | "daily";

/**
 * Тип пользователя
 */
export enum UserRole {
  USER = "USER",
  PREMIUM = "PREMIUM",
  ADMIN = "ADMIN",
}

/** Провайдер входа (LOCAL, GOOGLE, YANDEX, VK) */
export type AuthProviderType = "LOCAL" | "GOOGLE" | "YANDEX" | "VK";

/**
 * Интерфейс пользователя
 */
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isPremium: boolean;
  role: UserRole;
  createdAt: string;
  /** Текущий привязанный OAuth-провайдер (если есть) */
  provider?: AuthProviderType;
}
