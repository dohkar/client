/**
 * Управление данными в cookies.
 * Для auth: access token хранится в памяти (access-token-storage),
 * refresh — в HttpOnly cookie (устанавливает сервер). Этот модуль для токенов не используется.
 */

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

// Настройки для cookies
const COOKIE_OPTIONS = {
  maxAge: 7 * 24 * 60 * 60, // 7 дней
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

/**
 * Установить cookie
 */
function setCookie(name: string, value: string, days: number = 7): void {
  if (typeof document === "undefined") return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

  const cookieValue = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=${COOKIE_OPTIONS.path}; SameSite=${COOKIE_OPTIONS.sameSite}${COOKIE_OPTIONS.secure ? "; Secure" : ""}`;
  document.cookie = cookieValue;
}

/**
 * Получить cookie
 */
function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const nameEQ = name + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
}

/**
 * Удалить cookie
 */
function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${COOKIE_OPTIONS.path};`;
}

export const cookieStorage = {
  /**
   * Сохранить токены
   */
  saveTokens(accessToken: string, refreshToken: string): void {
    setCookie(ACCESS_TOKEN_KEY, accessToken, 1); // Access token на 1 день
    setCookie(REFRESH_TOKEN_KEY, refreshToken, 7); // Refresh token на 7 дней
  },

  /**
   * Получить access token
   */
  getAccessToken(): string | null {
    return getCookie(ACCESS_TOKEN_KEY);
  },

  /**
   * Получить refresh token
   */
  getRefreshToken(): string | null {
    return getCookie(REFRESH_TOKEN_KEY);
  },

  /**
   * Очистить токены
   */
  clearTokens(): void {
    deleteCookie(ACCESS_TOKEN_KEY);
    deleteCookie(REFRESH_TOKEN_KEY);
  },

  /**
   * Проверить наличие токенов
   */
  hasTokens(): boolean {
    return !!this.getAccessToken() && !!this.getRefreshToken();
  },
};
