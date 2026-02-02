/**
 * Хранение access token только в памяти (без localStorage/cookie).
 * Best practice: доступ к токену только из JS, при перезагрузке страницы — получаем
 * новый через refresh (refresh token в HttpOnly cookie отправляется автоматически).
 */

let accessToken: string | null = null;

export const accessTokenStorage = {
  getAccessToken(): string | null {
    return accessToken;
  },

  setAccessToken(token: string): void {
    accessToken = token;
  },

  clearAccessToken(): void {
    accessToken = null;
  },

  hasAccessToken(): boolean {
    return !!accessToken;
  },
};
