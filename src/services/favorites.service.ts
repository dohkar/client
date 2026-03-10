import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";
import { adaptProperty } from "@/lib/property-adapter";
import { adaptFavoriteListing } from "@/lib/listing-adapter";
import type { Property } from "@/types/property";
import type { PropertyBackend } from "@/types/property";
import type { FavoriteItem } from "@/types/favorites";
import type { FavoriteListingBackend } from "@/lib/listing-adapter";
import type { FavoritesListResponse, OperationResponse } from "@/lib/api-types";
import type { ExtendedError } from "@/types";

/** Проверяет, что строка является валидным UUID */
function isValidUuid(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id.trim()
  );
}

function sanitizeAndValidateId(rawId: string, fieldName: string): string {
  const id = rawId?.trim();
  if (!isValidUuid(id)) {
    throw new Error(`Некорректный ID ${fieldName}`);
  }
  return id;
}

/** Элемент ответа API избранного: может содержать property и/или listing */
type FavoriteApiItem = {
  property?: PropertyBackend;
  listing?: FavoriteListingBackend;
};

/**
 * Сервис для работы с избранным. Все методы — fail-fast и с логированием ошибок.
 */
export const favoritesService = {
  /**
   * Получить список избранного: объявления недвижимости (Property) и листинги (Listing).
   * Для раздела «Избранное» можно отображать оба типа в одном списке.
   */
  async getFavorites(): Promise<FavoriteItem[]> {
    try {
      const response = await apiClient.get<FavoritesListResponse>(
        API_ENDPOINTS.favorites.list
      );
      if (!Array.isArray(response)) {
        throw new Error("Некорректный ответ от сервера");
      }
      const items: FavoriteItem[] = [];
      for (const fav of response as FavoriteApiItem[]) {
        if (fav?.property) {
          items.push({ type: "property", data: adaptProperty(fav.property) });
        }
        if (fav?.listing) {
          items.push({ type: "listing", data: adaptFavoriteListing(fav.listing) });
        }
      }
      return items;
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error("Не удалось получить избранное");
    }
  },

  /**
   * Добавить объявление недвижимости в избранное.
   */
  async addFavorite(propertyId: string): Promise<void> {
    const id = sanitizeAndValidateId(propertyId, "объявления");
    try {
      await apiClient.post<OperationResponse<"FavoritesController_add", 201>>(
        API_ENDPOINTS.favorites.add(id)
      );
    } catch (error) {
      const status =
        error && typeof error === "object" && "status" in error
          ? (error as ExtendedError).status
          : undefined;
      if (status === 409) {
        return;
      }
      console.error(`Ошибка при добавлении в избранное id:${id}:`, error);
      throw error instanceof Error ? error : new Error("Не удалось добавить в избранное");
    }
  },

  /**
   * Удалить объявление недвижимости из избранного.
   */
  async removeFavorite(propertyId: string): Promise<void> {
    const id = sanitizeAndValidateId(propertyId, "объявления");
    try {
      await apiClient.delete<OperationResponse<"FavoritesController_remove", 200>>(
        API_ENDPOINTS.favorites.remove(id)
      );
    } catch (error) {
      console.error(`Ошибка при удалении из избранного id:${id}:`, error);
      throw error instanceof Error
        ? error
        : new Error("Не удалось удалить из избранного");
    }
  },

  /**
   * Добавить listing (любой категории) в избранное.
   */
  async addListingFavorite(listingId: string): Promise<void> {
    const id = sanitizeAndValidateId(listingId, "listing");
    try {
      await apiClient.post(API_ENDPOINTS.favorites.addListing(id));
    } catch (error) {
      const status =
        error && typeof error === "object" && "status" in error
          ? (error as ExtendedError).status
          : undefined;
      if (status === 409) {
        return;
      }
      console.error(`Ошибка при добавлении listing в избранное id:${id}:`, error);
      throw error instanceof Error ? error : new Error("Не удалось добавить в избранное");
    }
  },

  /**
   * Удалить listing из избранного.
   */
  async removeListingFavorite(listingId: string): Promise<void> {
    const id = sanitizeAndValidateId(listingId, "listing");
    try {
      await apiClient.delete(API_ENDPOINTS.favorites.removeListing(id));
    } catch (error) {
      console.error(`Ошибка при удалении listing из избранного id:${id}:`, error);
      throw error instanceof Error
        ? error
        : new Error("Не удалось удалить из избранного");
    }
  },
};
