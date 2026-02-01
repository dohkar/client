import { API_URL, ROUTES } from "@/constants";
import { cookieStorage } from "@/lib/cookie-storage";
import type { ApiError, ExtendedError, NetworkError } from "@/types";

/**
 * Стандартный формат ответа от API
 */
interface ApiResponse<T> {
  status: "success" | "error";
  data: T;
  message?: string;
}

/**
 * Базовый класс для работы с API
 * Использует httpOnly cookies для хранения токенов (управляются сервером)
 * Поддерживает отмену запросов через AbortController
 */
class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;
  private activeRequests = new Map<string, AbortController>();

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Отменяет все активные запросы для заданного ключа
   */
  cancelRequest(key: string): void {
    const controller = this.activeRequests.get(key);
    if (controller) {
      controller.abort();
      this.activeRequests.delete(key);
    }
  }

  /**
   * Отменяет все активные запросы
   */
  cancelAllRequests(): void {
    this.activeRequests.forEach((controller) => controller.abort());
    this.activeRequests.clear();
  }

  /**
   * Обновить access token используя refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const currentRefreshToken = cookieStorage.getRefreshToken();
        if (!currentRefreshToken) {
          throw new Error("Refresh token отсутствует");
        }

        const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken: currentRefreshToken }),
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Не удалось обновить токен");
        }

        const json = await response.json();
        // API возвращает { status, data } - извлекаем data
        const data = json.data || json;
        if (data.accessToken && data.refreshToken) {
          cookieStorage.saveTokens(data.accessToken, data.refreshToken);
        } else {
          throw new Error("Неверный формат ответа");
        }
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Выполняет HTTP запрос с автоматическим обновлением токена
   * Токены в httpOnly cookies отправляются браузером автоматически
   * @param endpoint - путь API
   * @param options - опции запроса
   * @param retryCount - счетчик повторных попыток
   * @param requestKey - ключ для отмены запроса (опционально)
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0,
    requestKey?: string
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Создаем AbortController для этого запроса
    const controller = new AbortController();
    const effectiveKey = requestKey || url;

    // Не отменяем критические запросы (auth) автоматически
    const isAuthRequest = endpoint.includes("/auth/");
    if (!isAuthRequest && requestKey) {
      // Отменяем предыдущий запрос с таким же ключом только если явно указан requestKey
      this.cancelRequest(effectiveKey);
    }
    this.activeRequests.set(effectiveKey, controller);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Добавляем Authorization header если есть токен в cookies
    const accessToken = cookieStorage.getAccessToken();
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: "include", // Важно для отправки httpOnly cookies
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);

      // Удаляем контроллер после успешного запроса
      this.activeRequests.delete(effectiveKey);

      // Если 401, пытаемся обновить токен (только один раз)
      // Не делаем refresh для login/register — там 401 значит «неверный логин или пароль»
      const isLoginOrRegister =
        endpoint.includes("/auth/login") || endpoint.includes("/auth/register");
      if (
        response.status === 401 &&
        retryCount === 0 &&
        !isLoginOrRegister
      ) {
        try {
          await this.refreshAccessToken();
          // Повторяем запрос - новый токен уже в httpOnly cookie
          const retryResponse = await fetch(url, config);

          if (!retryResponse.ok) {
            throw await this.handleError(retryResponse);
          }

          const retryJson = await retryResponse.json();
          // API возвращает { status, data } - извлекаем data
          return retryJson.data !== undefined ? retryJson.data : retryJson;
        } catch (refreshError) {
          // Не редиректим, если просто нет refresh token (пользователь не залогинен)
          const isNoRefreshToken =
            refreshError instanceof Error &&
            refreshError.message === "Refresh token отсутствует";
          if (!isNoRefreshToken && typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("auth:session-expired"));
            window.location.href = ROUTES.login;
          }
          throw refreshError;
        }
      }

      if (!response.ok) {
        throw await this.handleError(response);
      }

      const json = await response.json();
      // API возвращает { status, data } - извлекаем data
      return json.data !== undefined ? json.data : json;
    } catch (error) {
      // Удаляем контроллер при ошибке
      this.activeRequests.delete(effectiveKey);

      // Если запрос был отменен, не ретраим
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }

      // Retry для сетевых ошибок
      const networkError = error as NetworkError;
      if (
        retryCount < 2 &&
        (error instanceof TypeError || networkError?.code === "ECONNRESET")
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.request<T>(endpoint, options, retryCount + 1, requestKey);
      }

      // Если это уже ApiError из handleError, пробрасываем как ExtendedError
      if (error && typeof error === "object" && "message" in error) {
        const apiError = error as ApiError;
        const errorInstance = new Error(apiError.message) as ExtendedError;
        errorInstance.status = apiError.status;
        errorInstance.code = apiError.code;
        throw errorInstance;
      }

      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Неизвестная ошибка");
    }
  }

  /**
   * Обработка ошибок ответа
   */
  private async handleError(response: Response): Promise<ApiError> {
    let errorMessage = `HTTP error! status: ${response.status}`;
    let errorData: { message?: string; error?: string; code?: string } | null = null;

    try {
      errorData = await response.json();
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      }
    } catch {
      // Если не удалось распарсить JSON, используем стандартное сообщение
    }

    const error: ApiError = {
      message: errorMessage,
      status: response.status,
      code: errorData?.code,
    };

    return error;
  }

  /**
   * GET запрос
   * @param endpoint - путь API
   * @param options - опции запроса
   * @param requestKey - ключ для отмены запроса (по умолчанию используется endpoint)
   */
  async get<T>(endpoint: string, options?: RequestInit, requestKey?: string): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" }, 0, requestKey);
  }

  /**
   * POST запрос
   * @param endpoint - путь API
   * @param data - тело запроса
   * @param options - опции запроса
   * @param requestKey - ключ для отмены запроса
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit,
    requestKey?: string
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        ...options,
        method: "POST",
        body: JSON.stringify(data),
      },
      0,
      requestKey
    );
  }

  /**
   * PUT запрос
   * @param endpoint - путь API
   * @param data - тело запроса
   * @param options - опции запроса
   * @param requestKey - ключ для отмены запроса
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit,
    requestKey?: string
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        ...options,
        method: "PUT",
        body: JSON.stringify(data),
      },
      0,
      requestKey
    );
  }

  /**
   * PATCH запрос
   * @param endpoint - путь API
   * @param data - тело запроса
   * @param options - опции запроса
   * @param requestKey - ключ для отмены запроса
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit,
    requestKey?: string
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        ...options,
        method: "PATCH",
        body: JSON.stringify(data),
      },
      0,
      requestKey
    );
  }

  /**
   * DELETE запрос
   * @param endpoint - путь API
   * @param options - опции запроса
   * @param requestKey - ключ для отмены запроса
   */
  async delete<T>(
    endpoint: string,
    options?: RequestInit,
    requestKey?: string
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" }, 0, requestKey);
  }
}

export const apiClient = new ApiClient();
