/**
 * Планировщик проактивного обновления access token до истечения (silent re-auth).
 * Запускается при наличии refresh token; при visibilitychange (возврат во вкладку) проверяет сессию.
 */

import { getAccessTokenExpiration } from "./jwt-utils";
import { cookieStorage } from "./cookie-storage";

const REFRESH_BEFORE_EXP_SEC = 90;
const CHECK_INTERVAL_MS = 60_000;

type RefreshFn = () => Promise<boolean>;

let scheduleTimeoutId: ReturnType<typeof setTimeout> | null = null;
let checkIntervalId: ReturnType<typeof setInterval> | null = null;

function clearTimers(): void {
  if (scheduleTimeoutId !== null) {
    clearTimeout(scheduleTimeoutId);
    scheduleTimeoutId = null;
  }
  if (checkIntervalId !== null) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
  }
}

/**
 * Планирует следующий вызов refresh за REFRESH_BEFORE_EXP_SEC до истечения access token.
 */
function scheduleNextRefresh(refreshFn: RefreshFn): void {
  if (typeof window === "undefined") return;

  const accessToken = cookieStorage.getAccessToken();
  const refreshToken = cookieStorage.getRefreshToken();
  if (!accessToken || !refreshToken) {
    clearTimers();
    return;
  }

  const exp = getAccessTokenExpiration(accessToken);
  if (exp === null) {
    clearTimers();
    return;
  }

  const nowSec = Date.now() / 1000;
  const delaySec = Math.max(0, exp - REFRESH_BEFORE_EXP_SEC - nowSec);
  const delayMs = Math.min(delaySec * 1000, Math.pow(2, 31) - 1);

  scheduleTimeoutId = setTimeout(() => {
    scheduleTimeoutId = null;
    void refreshFn().then((ok) => {
      if (ok) scheduleNextRefresh(refreshFn);
    });
  }, delayMs);
}

/**
 * Запускает планировщик silent refresh и опционально интервал проверки + visibility.
 */
export function startSilentAuthScheduler(refreshFn: RefreshFn): () => void {
  if (typeof window === "undefined") return () => {};

  clearTimers();
  scheduleNextRefresh(refreshFn);

  checkIntervalId = setInterval(() => {
    const accessToken = cookieStorage.getAccessToken();
    const refreshToken = cookieStorage.getRefreshToken();
    if (!refreshToken) {
      clearTimers();
      return;
    }
    const exp = getAccessTokenExpiration(accessToken ?? "");
    if (exp === null) return;
    const nowSec = Date.now() / 1000;
    if (exp - REFRESH_BEFORE_EXP_SEC <= nowSec) {
      void refreshFn().then((ok) => {
        if (ok) scheduleNextRefresh(refreshFn);
      });
    }
  }, CHECK_INTERVAL_MS);

  const onVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      const accessToken = cookieStorage.getAccessToken();
      const refreshToken = cookieStorage.getRefreshToken();
      if (!refreshToken) return;
      const exp = getAccessTokenExpiration(accessToken ?? "");
      if (exp !== null && exp - REFRESH_BEFORE_EXP_SEC <= Date.now() / 1000) {
        void refreshFn().then((ok) => {
          if (ok) scheduleNextRefresh(refreshFn);
        });
      }
    }
  };

  document.addEventListener("visibilitychange", onVisibilityChange);

  return () => {
    clearTimers();
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}

/**
 * Останавливает планировщик (вызвать при logout).
 */
export function stopSilentAuthScheduler(): void {
  clearTimers();
}
