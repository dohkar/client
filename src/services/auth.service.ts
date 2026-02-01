import { apiClient } from "@/lib/api-client";
import { cookieStorage } from "@/lib/cookie-storage";
import { API_ENDPOINTS } from "@/constants/routes";
import { API_URL } from "@/constants/config";
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
   * Отправить SMS-код на номер телефона (для входа по коду)
   */
  async sendCode(phone: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>("/api/auth/send-code", {
      phone,
    });
  },

  /**
   * Подтвердить код и войти/зарегистрироваться по SMS
   * Сохраняет токены в cookies и возвращает данные пользователя
   */
  async verifyCode(
    phone: string,
    code: string
  ): Promise<UserGetMeResponse> {
    const response = await apiClient.post<{
      accessToken: string;
      refreshToken: string;
      user: UserGetMeResponse;
    }>("/api/auth/phone/verify", { phone, code });

    cookieStorage.saveTokens(response.accessToken, response.refreshToken);
    return response.user;
  },

  /**
   * Обновление токена (для 401 retry и для явного вызова)
   */
  async refreshToken(): Promise<void> {
    const ok = await this.silentRefresh();
    if (ok) await this.getCurrentUser();
  },

  /**
   * Тихий refresh: POST refresh с токеном из cookie, сохраняет новую пару в cookie.
   * Возвращает true при успехе, false при ошибке (для планировщика silent re-auth).
   */
  async silentRefresh(): Promise<boolean> {
    const baseUrl = API_URL;
    const refreshToken = cookieStorage.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        credentials: "include",
      });

      if (!response.ok) return false;

      const json = await response.json();
      const data = json.data ?? json;
      if (data.accessToken && data.refreshToken) {
        cookieStorage.saveTokens(data.accessToken, data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
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
   * Получить OAuth URL (для popup/redirect и для привязки аккаунта)
   */
  getOAuthUrl(
    provider: "google" | "yandex" | "vk",
    options?: { state?: string }
  ): string {
    const baseUrl = API_URL;
    const endpoints: Record<string, string> = {
      google: API_ENDPOINTS.auth.google,
      yandex: API_ENDPOINTS.auth.yandex,
      vk: API_ENDPOINTS.auth.vk,
    };
    const path = endpoints[provider] ?? "";
    const url = `${baseUrl}${path}`;
    if (options?.state) {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}state=${encodeURIComponent(options.state)}`;
    }
    return url;
  },
};
