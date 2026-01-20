import { apiClient } from "@/lib/api-client";
import { cookieStorage } from "@/lib/cookie-storage";
import { API_ENDPOINTS } from "@/constants/routes";
import type {
  AuthLoginRequest,
  AuthRegisterRequest,
  UserGetMeResponse,
} from "@/lib/api-types";

/**
 * Сервис для работы с авторизацией
 */
export const authService = {
  /**
   * Получить текущего пользователя
   */
  async getCurrentUser(): Promise<UserGetMeResponse> {
    return apiClient.get<UserGetMeResponse>(API_ENDPOINTS.auth.me);
  },

  /**
   * Вход в систему
   */
  async login(credentials: AuthLoginRequest): Promise<UserGetMeResponse> {
    const response = await apiClient.post<{
      accessToken: string;
      refreshToken: string;
      user: UserGetMeResponse;
    }>("/api/auth/login/phone-password", credentials);

    // Сохраняем токены в cookies
    cookieStorage.saveTokens(response.accessToken, response.refreshToken);

    return response.user;
  },

  /**
   * Регистрация
   */
  async register(data: AuthRegisterRequest): Promise<UserGetMeResponse> {
    try {
      const response = await apiClient.post<{
        accessToken: string;
        refreshToken: string;
        user: UserGetMeResponse;
      }>("/api/auth/register/phone-password", data);

      // Сохраняем токены в cookies
      cookieStorage.saveTokens(response.accessToken, response.refreshToken);

      return response.user;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      if (error && typeof error === "object" && "message" in error) {
        throw new Error((error as { message: string }).message);
      }
      throw new Error("Ошибка регистрации");
    }
  },

  /**
   * Обновление токена
   */
  async refreshToken(): Promise<void> {
    // No need to get refreshToken from client-side cookieStorage
    // The backend is expected to read httpOnly cookies automatically
    await apiClient.post<void>("/api/auth/refresh");
    // After refresh, verify user status
    await this.getCurrentUser();
  },

  /**
   * Выход из системы
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post<void>(API_ENDPOINTS.auth.logout);
    } finally {
      cookieStorage.clearTokens();
    }
  },

  // Примечание: Методы forgotPassword, resetPassword, changePassword
  // не представлены в текущей OpenAPI спецификации

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
