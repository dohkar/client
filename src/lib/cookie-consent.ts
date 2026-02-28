export const CONSENT_COOKIE = "cookie_consent";
export const CONSENT_VERSION = "v1"; // bumping сбрасывает старые согласия

export type ConsentValue = "accepted" | "declined";

/** Работает и на сервере (headers) и на клиенте (document.cookie) */
export function getConsentFromCookieString(
  cookieString: string,
): ConsentValue | null {
  const match = cookieString
    .split("; ")
    .find((r) => r.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;
  const val = match.split("=")[1];
  return val === "accepted" || val === "declined" ? val : null;
}

/** Только клиент */
export function getConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  return getConsentFromCookieString(document.cookie);
}

export function setConsent(value: ConsentValue) {
  const maxAge = 365 * 24 * 60 * 60;
  document.cookie = [
    `${CONSENT_COOKIE}=${value}`,
    `max-age=${maxAge}`,
    `path=/`,
    `SameSite=Lax`,
  ].join("; ");
}

export function clearConsent() {
  document.cookie = `${CONSENT_COOKIE}=; max-age=0; path=/`;
}
