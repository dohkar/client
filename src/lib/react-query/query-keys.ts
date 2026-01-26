/**
 * Query keys для React Query
 * Централизованное управление ключами запросов
 */
import type { PropertySearchParams } from "@/types/property";

/**
 * Нормализует параметры поиска для стабильного ключа
 * Удаляет undefined значения и сортирует ключи для консистентности
 */
function normalizeSearchParams(
  params?: PropertySearchParams
): PropertySearchParams | undefined {
  if (!params) return undefined;

  const normalized: PropertySearchParams = {};

  // Добавляем только определенные значения в отсортированном порядке
  if (params.query !== undefined && params.query.trim().length > 0) {
    normalized.query = params.query.trim();
  }
  if (params.type !== undefined) {
    normalized.type = params.type;
  }
  if (params.priceMin !== undefined && params.priceMin !== null) {
    normalized.priceMin = params.priceMin;
  }
  if (params.priceMax !== undefined && params.priceMax !== null) {
    normalized.priceMax = params.priceMax;
  }
  if (params.rooms !== undefined && params.rooms !== null) {
    normalized.rooms = params.rooms;
  }
  if (params.areaMin !== undefined && params.areaMin !== null) {
    normalized.areaMin = params.areaMin;
  }
  if (params.region !== undefined) {
    normalized.region = params.region;
  }
  if (params.sortBy !== undefined) {
    normalized.sortBy = params.sortBy;
  }
  if (params.page !== undefined && params.page > 1) {
    normalized.page = params.page;
  }
  if (params.limit !== undefined) {
    normalized.limit = params.limit;
  }

  // Возвращаем undefined если объект пустой
  if (Object.keys(normalized).length === 0) {
    return undefined;
  }

  return normalized;
}

export const queryKeys = {
  // Properties
  properties: {
    all: ["properties"] as const,
    lists: () => ["properties", "list"] as const,
    list: (filters?: PropertySearchParams) => {
      const normalized = normalizeSearchParams(filters);
      // Используем стабильный ключ - либо нормализованные фильтры, либо пустой массив
      return normalized
        ? (["properties", "list", normalized] as const)
        : (["properties", "list"] as const);
    },
    details: () => ["properties", "detail"] as const,
    detail: (id: string) => ["properties", "detail", id] as const,
    search: (query: string) => {
      const trimmed = query.trim();
      // Не создаем ключ для пустых запросов
      if (trimmed.length === 0) {
        return ["properties", "search", ""] as const;
      }
      return ["properties", "search", trimmed] as const;
    },
    categoryStats: ["properties", "categoryStats"] as const,
  },

  // Auth
  auth: {
    all: ["auth"] as const,
    user: () => ["auth", "user"] as const,
    session: () => ["auth", "session"] as const,
  },

  // Favorites
  favorites: {
    all: ["favorites"] as const,
    list: () => ["favorites", "list"] as const,
  },

  // User
  user: {
    all: ["user"] as const,
    profile: (id: string) => ["user", "profile", id] as const,
    listings: (userId: string) => ["user", "listings", userId] as const,
  },

  // Chats
  chats: {
    all: ["chats"] as const,
    list: () => ["chats", "list"] as const,
    detail: (chatId: string) => ["chats", "detail", chatId] as const,
    messages: (chatId: string, cursor?: string) =>
      cursor
        ? (["chats", "messages", chatId, cursor] as const)
        : (["chats", "messages", chatId] as const),
  },
} as const;
