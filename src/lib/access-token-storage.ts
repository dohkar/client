/**
 * Access token: в памяти + localStorage для пережития перезагрузки вкладки.
 * Refresh token по-прежнему только HttpOnly cookie на домене API (в DevTools смотрите
 * cookies для хоста бэкенда, например localhost:4000 — поле может называться refresh_token).
 *
 * XSS может прочитать localStorage; компромисс для стабильной сессии при проблемах с cookie.
 */

const STORAGE_KEY = "dohkar_access_token_v1";

let accessToken: string | null = null;

function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "===".slice((b64.length + 3) % 4);
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function isExpired(token: string): boolean {
  const exp = decodeJwtExp(token);
  if (exp === null) return false;
  return Date.now() >= exp * 1000;
}

function readFromLocalStorage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeToLocalStorage(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // приватный режим / квота
  }
}

function removeFromLocalStorage(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export const accessTokenStorage = {
  getAccessToken(): string | null {
    let token = accessToken ?? readFromLocalStorage();
    if (!token) return null;
    if (isExpired(token)) {
      accessToken = null;
      removeFromLocalStorage();
      return null;
    }
    if (!accessToken && token) {
      accessToken = token;
    }
    return token;
  },

  setAccessToken(token: string): void {
    accessToken = token;
    writeToLocalStorage(token);
  },

  clearAccessToken(): void {
    accessToken = null;
    removeFromLocalStorage();
  },

  hasAccessToken(): boolean {
    return accessTokenStorage.getAccessToken() !== null;
  },
};
