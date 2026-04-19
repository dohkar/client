/**
 * Геокодирование через Next.js API (/api/geocode, /api/reverse-geocode),
 * на сервере — DaData (подсказки по адресу и геолокация по координатам).
 */

/** Структурированный адрес для геокодирования */
export interface StructuredAddressInput {
  country?: string;
  region?: string;
  city?: string;
  street?: string;
  house?: string;
}

export interface AddressComponents {
  region?: string;
  city?: string;
  street?: string;
  house?: string;
}

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  components: AddressComponents;
}

export interface ReverseGeocodeResult {
  formattedAddress: string;
  components: AddressComponents;
}

function buildGeocodeQuery(input: StructuredAddressInput): string {
  const parts: string[] = [];
  const country = input.country?.trim() || "Россия";
  parts.push(country);
  if (input.region?.trim()) parts.push(input.region.trim());
  if (input.city?.trim()) parts.push(input.city.trim());
  const streetHouse = [input.street?.trim(), input.house?.trim()]
    .filter(Boolean)
    .join(" ");
  if (streetHouse) parts.push(streetHouse);
  return parts.join(", ");
}

function isGeocodeSuccessBody(data: unknown): data is GeocodeResult {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  if (typeof o.latitude !== "number" || typeof o.longitude !== "number") return false;
  if (typeof o.formattedAddress !== "string") return false;
  if (!o.components || typeof o.components !== "object") return false;
  return Number.isFinite(o.latitude) && Number.isFinite(o.longitude);
}

function isReverseSuccessBody(data: unknown): data is ReverseGeocodeResult {
  if (!data || typeof data !== "object") return false;
  const o = data as Record<string, unknown>;
  if (typeof o.formattedAddress !== "string" || !o.formattedAddress) return false;
  if (!o.components || typeof o.components !== "object") return false;
  return true;
}

/** Результат геокодирования: успех с данными или ошибка с причиной */
export type GeocodeAddressResult =
  | { ok: true; data: GeocodeResult }
  | { ok: false; reason: "key" | "error" | "not_found"; message?: string };

/**
 * Геокодирование структурированного адреса через /api/geocode (DaData).
 */
export async function geocodeAddress(
  input: StructuredAddressInput
): Promise<GeocodeAddressResult> {
  const query = buildGeocodeQuery(input);
  if (!query || query.length < 3) {
    return { ok: false, reason: "not_found" };
  }

  try {
    const response = await fetch("/api/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      const body = data as { code?: string; error?: string };
      if (response.status === 404) {
        return { ok: false, reason: "not_found" };
      }
      if (body.code === "GEOCODER_FORBIDDEN" || response.status === 503) {
        return {
          ok: false,
          reason: "key",
          message: body.error ?? "Сервис адресов не настроен или ключ неверен.",
        };
      }
      return {
        ok: false,
        reason: "error",
        message: body.error,
      };
    }

    if (!isGeocodeSuccessBody(data)) {
      return { ok: false, reason: "not_found" };
    }

    const components = data.components as AddressComponents;
    return {
      ok: true,
      data: {
        latitude: data.latitude,
        longitude: data.longitude,
        formattedAddress: data.formattedAddress,
        components,
      },
    };
  } catch {
    return { ok: false, reason: "error" };
  }
}

/**
 * Обратное геокодирование (DaData). Вызывать с debounce с клиента.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  try {
    const response = await fetch("/api/reverse-geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude }),
    });

    if (!response.ok) return null;

    const data: unknown = await response.json();
    if (!isReverseSuccessBody(data)) return null;

    return {
      formattedAddress: data.formattedAddress,
      components: data.components as AddressComponents,
    };
  } catch {
    return null;
  }
}
