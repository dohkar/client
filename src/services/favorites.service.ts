import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";
import { adaptProperty } from "@/lib/property-adapter";
import type { Property } from "@/types/property";
import type { FavoritesListResponse, OperationResponse } from "@/lib/api-types";
import type { PropertyBackend } from "@/types/property";
import type { ExtendedError } from "@/types";

/** Проверяет, что строка является валидным UUID */
function isValidUuid(propertyId: string): boolean {
  if (!propertyId || typeof propertyId !== "string") return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    propertyId.trim()
  );
}

/** Приводит строку UUID к валидному виду и валидирует. Бросает ошибку если невалидно. */
function sanitizeAndValidatePropertyId(propertyId: string): string {
  const id = propertyId?.trim();
  if (!isValidUuid(id)) {
    throw new Error("Некорректный ID объявления");
  }
  return id;
}

/**
 * Сервис для работы с избранным. Все методы — fail-fast и покрыты логированием ошибок для прод-готовности.
 */
export const favoritesService = {
  /**
   * Получить список избранных объявлений
   */
  async getFavorites(): Promise<Property[]> {
    try {
      const response = await apiClient.get<FavoritesListResponse>(
        API_ENDPOINTS.favorites.list
      );
      if (!Array.isArray(response)) {
        console.error("Некорректный ответ favorites.list: ожидался массив", response);
        throw new Error("Некорректный ответ от сервера");
      }
      const propertiesBackend = response
        .map((fav) => fav?.property)
        .filter(Boolean) as PropertyBackend[];
      return propertiesBackend.map(adaptProperty);
    } catch (error) {
      console.error("Ошибка получения избранных объявлений:", error);
      throw error instanceof Error ? error : new Error("Не удалось получить избранное");
    }
  },

  /**
   * Добавить объявление в избранное.
   * @param propertyId UUID объявления.
   */
  async addFavorite(propertyId: string): Promise<void> {
    const id = sanitizeAndValidatePropertyId(propertyId);
    try {
      await apiClient.post<OperationResponse<"FavoritesController_add", 201>>(
        API_ENDPOINTS.favorites.add(id)
      );
    } catch (error) {
      const status = error && typeof error === "object" && "status" in error
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
   * Удалить объявление из избранного.
   * @param propertyId UUID объявления.
   */
  async removeFavorite(propertyId: string): Promise<void> {
    const id = sanitizeAndValidatePropertyId(propertyId);
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
};
