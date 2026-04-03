import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";
import { adaptFavoriteListing } from "@/lib/listing-adapter";
import { logger } from "@/lib/utils/logger";
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

type FavoriteApiItem = {
  listing?: FavoriteListingBackend;
};

export const favoritesService = {
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

  async addFavorite(listingId: string): Promise<void> {
    const id = sanitizeAndValidateId(listingId, "listing");
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
      logger.error("Ошибка при добавлении в избранное", { listingId: id, error });
      throw error instanceof Error ? error : new Error("Не удалось добавить в избранное");
    }
  },

  async removeFavorite(listingId: string): Promise<void> {
    const id = sanitizeAndValidateId(listingId, "listing");
    try {
      await apiClient.delete<OperationResponse<"FavoritesController_remove", 200>>(
        API_ENDPOINTS.favorites.remove(id)
      );
    } catch (error) {
      const status =
        error && typeof error === "object" && "status" in error
          ? (error as ExtendedError).status
          : undefined;
      /** Уже удалено / рассинхрон — считаем успехом (идемпотентность) */
      if (status === 404) {
        return;
      }
      logger.error("Ошибка при удалении из избранного", { listingId: id, error });
      throw error instanceof Error
        ? error
        : new Error("Не удалось удалить из избранного");
    }
  },
};
