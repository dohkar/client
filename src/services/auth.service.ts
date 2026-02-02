import { apiClient } from "@/lib/api-client";
import { accessTokenStorage } from "@/lib/access-token-storage";
import { API_ENDPOINTS } from "@/constants/routes";
import { API_URL } from "@/constants/config";
import type {
  AuthLoginRequest,
  AuthRegisterRequest,
  UserGetMeResponse,
} from "@/lib/api-types";

/**
 * Сервис для работы с авторизацией.
 * Access token — только в памяти; refresh — в HttpOnly cookie (управляется сервером).
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
      user: UserGetMeResponse;
    }>("/api/auth/login/phone-password", credentials);

    accessTokenStorage.setAccessToken(response.accessToken);
    return response.user;
  },

  /**
   * Регистрация
   */
  async register(data: AuthRegisterRequest): Promise<UserGetMeResponse> {
    try {
      const response = await apiClient.post<{
        accessToken: string;
        user: UserGetMeResponse;
      }>("/api/auth/register/phone-password", data);

      accessTokenStorage.setAccessToken(response.accessToken);
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
   */
  async verifyCode(
    phone: string,
    code: string
  ): Promise<UserGetMeResponse> {
    const response = await apiClient.post<{
      accessToken: string;
      user: UserGetMeResponse;
    }>("/api/auth/phone/verify", { phone, code });

    accessTokenStorage.setAccessToken(response.accessToken);
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
   * Тихий refresh: POST refresh с credentials (refresh в HttpOnly cookie).
   * Сохраняет новый access token в память.
   */
  async silentRefresh(): Promise<boolean> {
    const baseUrl = API_URL;

    try {
      const response = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "include",
      });

      if (!response.ok) return false;

      const json = await response.json();
      const data = json.data ?? json;
      if (data.accessToken) {
        accessTokenStorage.setAccessToken(data.accessToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  /**
   * Выход из системы (очищаем access в памяти; refresh cookie очищает сервер)
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post<void>(API_ENDPOINTS.auth.logout);
    } finally {
      accessTokenStorage.clearAccessToken();
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
