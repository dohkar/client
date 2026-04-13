/**
 * Access token только в памяти. После перезагрузки — POST /api/auth/refresh
 * (refresh в HttpOnly cookie, fetch с credentials: "include").
 */

const LEGACY_LS_KEY = "dohkar_access_token_v1";

let accessToken: string | null = null;

if (typeof window !== "undefined") {
  try {
    window.localStorage.removeItem(LEGACY_LS_KEY);
  } catch {
    /* ignore */
  }
}

export const accessTokenStorage = {
  getAccessToken(): string | null {
    return accessToken;
  },

  setAccessToken(token: string): void {
    accessToken = token;
  },

  clearAccessToken(): void {
    accessToken = null;
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(LEGACY_LS_KEY);
      } catch {
        /* ignore */
      }
    }
  },

  hasAccessToken(): boolean {
    return accessToken !== null;
  },
};
