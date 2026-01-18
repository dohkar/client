/**
 * Пример сервиса с использованием строгой типизации из OpenAPI
 *
 * Этот файл демонстрирует использование сгенерированных типов API
 * для обеспечения типобезопасности на уровне компиляции.
 */

import { apiClient } from "@/lib/api-client";
import type {
  AuthSendCodeRequest,
  AuthVerifyCodeRequest,
  AuthRegisterRequest,
  AuthLoginRequest,
  AuthRefreshRequest,
  UserGetMeResponse,
  OperationResponse,
} from "@/lib/api-types";
import type { operations } from "@/types/api";

/**
 * Типизированный сервис для работы с авторизацией
 *
 * Все методы используют типы, сгенерированные из OpenAPI спецификации,
 * что гарантирует соответствие запросов и ответов API контракту.
 */
export const authTypedService = {
  /**
   * Отправить SMS-код на номер телефона
   *
   * @param data - Данные запроса (типизированы из OpenAPI)
   * @returns Promise с результатом операции
   */
  async sendPhoneCode(
    data: AuthSendCodeRequest
  ): Promise<OperationResponse<"AuthController_sendPhoneCode", 201>> {
    const response = await apiClient.post<
      OperationResponse<"AuthController_sendPhoneCode", 201>
    >("/api/auth/send-code", data);

    return response;
  },

  /**
   * Подтвердить код и залогиниться/зарегистрироваться
   *
   * @param data - Данные запроса (типизированы из OpenAPI)
   * @returns Promise с результатом операции
   */
  async verifyPhoneCode(
    data: AuthVerifyCodeRequest
  ): Promise<OperationResponse<"AuthController_verifyPhoneCode", 200>> {
    const response = await apiClient.post<
      OperationResponse<"AuthController_verifyPhoneCode", 200>
    >("/api/auth/phone/verify", data);

    return response;
  },

  /**
   * Регистрация по номеру телефона и паролю
   *
   * @param data - Данные запроса (типизированы из OpenAPI)
   * @returns Promise с результатом операции
   */
  async registerWithPhoneAndPassword(
    data: AuthRegisterRequest
  ): Promise<OperationResponse<"AuthController_registerWithPhoneAndPassword", 201>> {
    const response = await apiClient.post<
      OperationResponse<"AuthController_registerWithPhoneAndPassword", 201>
    >("/api/auth/register/phone-password", data);

    return response;
  },

  /**
   * Вход по номеру телефона и паролю
   *
   * @param data - Данные запроса (типизированы из OpenAPI)
   * @returns Promise с результатом операции
   */
  async loginWithPhoneAndPassword(
    data: AuthLoginRequest
  ): Promise<OperationResponse<"AuthController_loginWithPhoneAndPassword", 200>> {
    const response = await apiClient.post<
      OperationResponse<"AuthController_loginWithPhoneAndPassword", 200>
    >("/api/auth/login/phone-password", data);

    return response;
  },

  /**
   * Обновление access token
   *
   * @param data - Данные запроса (типизированы из OpenAPI)
   * @returns Promise с результатом операции
   */
  async refreshToken(
    data: AuthRefreshRequest
  ): Promise<OperationResponse<"AuthController_refresh", 200>> {
    const response = await apiClient.post<
      OperationResponse<"AuthController_refresh", 200>
    >("/api/auth/refresh", data);

    return response;
  },

  /**
   * Выход из системы
   *
   * @returns Promise с результатом операции
   */
  async logout(): Promise<OperationResponse<"AuthController_logout", 200>> {
    const response = await apiClient.post<
      OperationResponse<"AuthController_logout", 200>
    >("/api/auth/logout");

    return response;
  },

  /**
   * Получить текущего пользователя
   *
   * @returns Promise с данными пользователя (типизированы из OpenAPI)
   */
  async getMe(): Promise<UserGetMeResponse> {
    const response = await apiClient.get<UserGetMeResponse>("/api/auth/me");

    return response;
  },
};

/**
 * Пример использования в компоненте или хуке:
 *
 * ```typescript
 * import { authTypedService } from "@/services/auth-typed.service";
 *
 * // TypeScript автоматически проверит типы на этапе компиляции
 * const result = await authTypedService.sendPhoneCode({
 *   phone: "+79626404047" // ✅ Тип проверен
 * });
 *
 * // Ошибка компиляции, если передать неверные данные:
 * // await authTypedService.sendPhoneCode({
 * //   phone: 123 // ❌ TypeScript ошибка: number не может быть присвоен string
 * // });
 * ```
 */
