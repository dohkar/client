import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";
import type {
  UserGetMeResponse,
  UserUpdateMeRequest,
  UserUpdateMeResponse,
  UserGetByIdResponse,
} from "@/lib/api-types";

/**
 * Сервис для работы с пользователями
 */
export const usersService = {
  /**
   * Получить текущего пользователя
   * Используйте authService.getCurrentUser() вместо этого
   */
  async getCurrentUser(): Promise<UserGetMeResponse> {
    return apiClient.get<UserGetMeResponse>(API_ENDPOINTS.users.me);
  },

  /**
   * Обновить профиль текущего пользователя
   */
  async updateUser(data: UserUpdateMeRequest): Promise<UserUpdateMeResponse> {
    return apiClient.patch<UserUpdateMeResponse>(API_ENDPOINTS.users.updateMe, data);
  },

  /**
   * Получить пользователя по ID
   */
  async getUserById(id: string): Promise<UserGetByIdResponse> {
    return apiClient.get<UserGetByIdResponse>(API_ENDPOINTS.users.getById(id));
  },
};
