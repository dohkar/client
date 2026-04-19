/**
 * Query keys для React Query
 * Централизованное управление ключами запросов
 */
import type { PropertySearchParams } from "@/types/property";
import type { ListingSearchParams } from "@/types/listing";

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
  if (params.my !== undefined) {
    normalized.my = params.my;
  }
  if (params.dealType !== undefined) {
    normalized.dealType = params.dealType;
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
  if (params.floorMin !== undefined && params.floorMin !== null) {
    normalized.floorMin = params.floorMin;
  }
  if (params.floorMax !== undefined && params.floorMax !== null) {
    normalized.floorMax = params.floorMax;
  }
  if (params.floorNotFirst !== undefined && params.floorNotFirst !== null) {
    normalized.floorNotFirst = params.floorNotFirst;
  }
  if (params.region !== undefined) {
    normalized.region = params.region;
  }
  if (params.cityId !== undefined && params.cityId.trim().length > 0) {
    normalized.cityId = params.cityId;
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

function normalizeListingSearchParams(
  params?: ListingSearchParams
): ListingSearchParams | undefined {
  if (!params) return undefined;

  const normalized: ListingSearchParams = {};

  if (params.query !== undefined && params.query.trim().length > 0) {
    normalized.query = params.query.trim();
  }
  if (params.my !== undefined) {
    normalized.my = params.my;
  }
  if (params.cabinetTab !== undefined) {
    normalized.cabinetTab = params.cabinetTab;
  }
  if (params.sellerId !== undefined && params.sellerId.trim().length > 0) {
    normalized.sellerId = params.sellerId.trim();
  }
  if (params.category !== undefined) {
    normalized.category = params.category;
  }
  if (params.dealType !== undefined) {
    normalized.dealType = params.dealType;
  }
  if (params.priceMin !== undefined && params.priceMin !== null) {
    normalized.priceMin = params.priceMin;
  }
  if (params.priceMax !== undefined && params.priceMax !== null) {
    normalized.priceMax = params.priceMax;
  }
  if (params.regionId !== undefined && params.regionId.trim().length > 0) {
    normalized.regionId = params.regionId.trim();
  }
  if (params.cityId !== undefined && params.cityId.trim().length > 0) {
    normalized.cityId = params.cityId.trim();
  }
  if (params.propertyType !== undefined) {
    normalized.propertyType = params.propertyType;
  }
  if (params.rooms !== undefined && params.rooms !== null) {
    normalized.rooms = params.rooms;
  }
  if (params.areaMin !== undefined && params.areaMin !== null) {
    normalized.areaMin = params.areaMin;
  }
  if (params.floorMin !== undefined && params.floorMin !== null) {
    normalized.floorMin = params.floorMin;
  }
  if (params.floorMax !== undefined && params.floorMax !== null) {
    normalized.floorMax = params.floorMax;
  }
  if (params.floorNotFirst !== undefined && params.floorNotFirst !== null) {
    normalized.floorNotFirst = params.floorNotFirst;
  }
  if (params.brandId !== undefined && params.brandId.trim().length > 0) {
    normalized.brandId = params.brandId.trim();
  }
  if (params.yearMin !== undefined && params.yearMin !== null) {
    normalized.yearMin = params.yearMin;
  }
  if (params.yearMax !== undefined && params.yearMax !== null) {
    normalized.yearMax = params.yearMax;
  }
  if (params.mileageMax !== undefined && params.mileageMax !== null) {
    normalized.mileageMax = params.mileageMax;
  }
  if (params.productType !== undefined && params.productType.trim().length > 0) {
    normalized.productType = params.productType.trim();
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
    limits: ["properties", "limits"] as const,
  },

  // Listings (multi-category)
  listings: {
    all: ["listings"] as const,
    lists: () => ["listings", "list"] as const,
    list: (filters?: ListingSearchParams) => {
      const normalized = normalizeListingSearchParams(filters);
      return normalized
        ? (["listings", "list", normalized] as const)
        : (["listings", "list"] as const);
    },
    details: () => ["listings", "detail"] as const,
    detail: (id: string) => ["listings", "detail", id] as const,
    categoryStats: ["listings", "categoryStats"] as const,
    limits: ["listings", "limits"] as const,
  },

  // Brands
  brands: {
    all: ["brands"] as const,
    list: (category?: string) =>
      category ? (["brands", "list", category] as const) : (["brands", "list"] as const),
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
    /** Гостевое избранное: стабильный ключ по отсортированным listingId */
    guest: (ids: readonly string[]) =>
      ["favorites", "guest", [...ids].sort().join("\0")] as const,
  },

  // User
  user: {
    all: ["user"] as const,
    profile: (id: string) => ["user", "profile", id] as const,
    publicProfile: (id: string) => ["user", "publicProfile", id] as const,
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
