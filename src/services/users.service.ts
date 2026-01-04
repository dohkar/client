import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";
import type { ApiResponse } from "@/types";
import type { User } from "@/types";

export interface UpdateUserData {
  name?: string;
  phone?: string;
  avatar?: string;
}

/**
 * Сервис для работы с пользователями
 */
export const usersService = {
  /**
   * Получить текущего пользователя
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<ApiResponse<User>>(API_ENDPOINTS.users.me);
  },

  /**
   * Обновить профиль текущего пользователя
   */
  async updateUser(data: UpdateUserData): Promise<ApiResponse<User>> {
    return apiClient.patch<ApiResponse<User>>(API_ENDPOINTS.users.updateMe, data);
  },

  /**
   * Получить пользователя по ID
   */
  async getUserById(id: string): Promise<ApiResponse<User>> {
    return apiClient.get<ApiResponse<User>>(API_ENDPOINTS.users.getById(id));
  },
};
