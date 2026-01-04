import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";
import type { ApiResponse } from "@/types";
import type { Property } from "@/types/property";
import { adaptProperty } from "@/lib/property-adapter";
import type { PropertyBackend } from "@/types/property";

export interface Favorite {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: string;
  property: PropertyBackend;
}

/**
 * Сервис для работы с избранным
 */
export const favoritesService = {
  /**
   * Получить список избранного
   */
  async getFavorites(): Promise<ApiResponse<Property[]>> {
    const response = await apiClient.get<ApiResponse<Favorite[]>>(
      API_ENDPOINTS.favorites.list
    );

    if (response.status === "success" && response.data) {
      return {
        ...response,
        data: response.data.map((fav) => adaptProperty(fav.property)),
      };
    }

    return {
      ...response,
      data: [],
    };
  },

  /**
   * Добавить в избранное
   */
  async addFavorite(propertyId: string): Promise<ApiResponse<void>> {
    return apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.favorites.add(propertyId)
    );
  },

  /**
   * Удалить из избранного
   */
  async removeFavorite(propertyId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.favorites.remove(propertyId)
    );
  },
};
