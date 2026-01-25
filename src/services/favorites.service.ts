import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";
import { adaptProperty } from "@/lib/property-adapter";
import { initializeRegionCache } from "@/services/region.service";
import type { Property } from "@/types/property";
import type {
  FavoritesListResponse,
  FavoritesAddParams,
  FavoritesRemoveParams,
  OperationResponse,
} from "@/lib/api-types";
import type { PropertyBackend } from "@/types/property"; // Keep for adapter input

/**
 * Сервис для работы с избранным
 */
export const favoritesService = {
  /**
   * Получить список избранного
   */
  async getFavorites(): Promise<Property[]> {
    const response = await apiClient.get<FavoritesListResponse>(
      API_ENDPOINTS.favorites.list
    );

    // Инициализируем кэш регионов на основе полученных данных
    const properties = response.map((fav) => fav.property);
    initializeRegionCache(properties);

    return properties.map(adaptProperty);
  },

  /**
   * Добавить в избранное
   */
  async addFavorite(propertyId: string): Promise<void> {
    await apiClient.post<OperationResponse<"FavoritesController_add", 201>>(
      API_ENDPOINTS.favorites.add(propertyId)
    );
  },

  /**
   * Удалить из избранного
   */
  async removeFavorite(propertyId: string): Promise<void> {
    await apiClient.delete<OperationResponse<"FavoritesController_remove", 200>>(
      API_ENDPOINTS.favorites.remove(propertyId)
    );
  },
};
