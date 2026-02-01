/**
 * Декодирование JWT без верификации подписи.
 * Используется только для чтения exp (время истечения) для планирования silent refresh.
 * Не использовать для авторизации или доверия данным из payload.
 */

export interface JwtPayloadExp {
  exp?: number;
}

/**
 * Извлекает exp (Unix timestamp в секундах) из access token.
 * @param accessToken — строка JWT (header.payload.signature)
 * @returns exp в секундах или null при ошибке/отсутствии
 */
export function getAccessTokenExpiration(accessToken: string): number | null {
  if (!accessToken || typeof accessToken !== "string") return null;
  try {
    const parts = accessToken.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(base64)) as JwtPayloadExp;
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}

/**
 * Проверяет, истёк ли access token (с запасом в bufferSec секунд).
 */
export function isAccessTokenExpired(
  accessToken: string,
  bufferSec: number = 0
): boolean {
  const exp = getAccessTokenExpiration(accessToken);
  if (exp === null) return true;
  return Date.now() / 1000 >= exp - bufferSec;
}
