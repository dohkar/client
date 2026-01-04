import { apiClient } from "@/lib/api-client";
import { cookieStorage } from "@/lib/cookie-storage";
import { API_ENDPOINTS } from "@/constants/routes";
import type { ApiResponse, User } from "@/types";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/**
 * Сервис для работы с авторизацией
 */
export const authService = {
  /**
   * Получить текущего пользователя
   */
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<ApiResponse<User>>(API_ENDPOINTS.auth.me);
  },

  /**
   * Вход в систему
   */
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    // Сервер возвращает напрямую AuthResponse, а не обернутый в ApiResponse
    // Токены устанавливаются сервером в httpOnly cookies автоматически
    const response = await apiClient.post<AuthResponse>(
      API_ENDPOINTS.auth.login,
      credentials
    );

    // Проверяем, что ответ содержит необходимые поля
    if (response && response.user) {
      // Токены уже установлены сервером в httpOnly cookies
      // Не нужно сохранять их на клиенте
      return response;
    }

    throw new Error("Ошибка входа: неверный формат ответа");
  },

  /**
   * Регистрация
   */
  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<AuthResponse> {
    try {
      // Сервер возвращает напрямую AuthResponse, а не обернутый в ApiResponse
      // Токены устанавливаются сервером в httpOnly cookies автоматически
      const response = await apiClient.post<AuthResponse>(
        API_ENDPOINTS.auth.register,
        data
      );

      // Проверяем, что ответ содержит необходимые поля
      if (response && response.user) {
        // Токены уже установлены сервером в httpOnly cookies
        // Не нужно сохранять их на клиенте
        return response;
      }

      throw new Error("Ошибка регистрации: неверный формат ответа");
    } catch (error) {
      // Если это уже Error с сообщением, пробрасываем его
      if (error instanceof Error) {
        throw error;
      }
      // Если это объект ошибки от API
      if (error && typeof error === "object" && "message" in error) {
        throw new Error((error as { message: string }).message);
      }
      throw new Error("Ошибка регистрации");
    }
  },

  /**
   * Обновление токена
   */
  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = cookieStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error("Refresh token не найден");
    }

    const response = await apiClient.post<
      ApiResponse<{ accessToken: string; refreshToken: string }>
    >(API_ENDPOINTS.auth.refresh, { refreshToken });

    if (response.status === "success" && response.data) {
      cookieStorage.saveTokens(response.data.accessToken, response.data.refreshToken);
      return response.data;
    }

    throw new Error(response.message || "Ошибка обновления токена");
  },

  /**
   * Выход из системы
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      await apiClient.post<ApiResponse<void>>(API_ENDPOINTS.auth.logout);
    } finally {
      // Очищаем токены в любом случае
      cookieStorage.clearTokens();
    }

    return {
      data: undefined,
      status: "success",
      message: "Выход выполнен",
    };
  },

  /**
   * Восстановление пароля
   */
  async forgotPassword(email: string): Promise<ApiResponse<void>> {
    return apiClient.post<ApiResponse<void>>(API_ENDPOINTS.auth.forgotPassword, {
      email,
    });
  },

  /**
   * Сброс пароля
   */
  async resetPassword(data: {
    token: string;
    newPassword: string;
  }): Promise<ApiResponse<void>> {
    return apiClient.post<ApiResponse<void>>(API_ENDPOINTS.auth.resetPassword, data);
  },

  /**
   * Изменение пароля
   */
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<void>> {
    return apiClient.post<ApiResponse<void>>(API_ENDPOINTS.auth.changePassword, data);
  },

  /**
   * Получить OAuth URL
   */
  getOAuthUrl(provider: "google" | "yandex" | "vk"): string {
    // Базовый URL БЕЗ глобального префикса /api — он уже есть в API_ENDPOINTS
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const endpoints = {
      google: API_ENDPOINTS.auth.google,
      yandex: API_ENDPOINTS.auth.yandex,
      vk: API_ENDPOINTS.auth.vk,
    };
    return `${baseUrl}${endpoints[provider]}`;
  },
};
