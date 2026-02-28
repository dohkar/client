/**
 * Клиентская утилита для работы с геокодированием через backend API proxy.
 * Важно: НЕ ходит напрямую к Yandex — только к своему серверу через /api/geocode
 * Структурированный ввод и разбор компонентов из ответа (логика осталась прежней).
 */

/** Структурированный адрес для геокодирования — теперь с country */
export interface StructuredAddressInput {
  country?: string; // << Новое поле
  region?: string;
  city?: string;
  street?: string;
  house?: string;
}

/** Структурированные компоненты адреса из ответа геокодера */
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

interface GeocoderResponseGeoObject {
  Point?: { pos?: string };
  metaDataProperty?: {
    GeocoderMetaData?: {
      text?: string;
      Address?: {
        Components?: Array<{ kind?: string; name?: string }>;
      };
    };
  };
}

interface GeocoderResponse {
  response?: {
    GeoObjectCollection?: {
      featureMember?: Array<{ GeoObject?: GeocoderResponseGeoObject }>;
    };
  };
}

/**
 * Собирает строку запроса из структурированных полей
 * Для Яндекса лучше начинать с "Россия"
 * Пример: "Россия, Московская область, Москва, Тверская улица 10"
 */
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

/**
 * Извлекает компоненты адреса из ответа геокодера по kind
 * Более надёжно определяет region
 */
function parseAddressComponents(
  components: Array<{ kind?: string; name?: string }> | undefined
): AddressComponents {
  const result: AddressComponents = {};
  if (!Array.isArray(components)) return result;

  const byKind = (k: string) => components.find((c) => c.kind === k)?.name;

  // region: сначала самые точные, потом fallback
  const region =
    byKind("province") ||
    byKind("area") ||
    byKind("administrative_area") ||
    byKind("country");
  if (region) result.region = region;

  // Город: локалити или район
  const city = byKind("locality") || byKind("district");
  if (city) result.city = city;

  const street = byKind("street");
  if (street) result.street = street;

  const house = byKind("house");
  if (house) result.house = house;

  return result;
}

/** Результат геокодирования: успех с данными или ошибка с причиной */
export type GeocodeAddressResult =
  | { ok: true; data: GeocodeResult }
  | { ok: false; reason: "key" | "error" | "not_found"; message?: string };

/**
 * Геокодирование структурированного адреса через backend proxy
 * (Только через серверный route, например /api/geocode)
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

    const data = await response.json();

    if (!response.ok) {
      const body = data as { code?: string; error?: string };
      if (body.code === "GEOCODER_FORBIDDEN" || response.status === 503) {
        return {
          ok: false,
          reason: "key",
          message: body.error ?? "Ключ геокодера не настроен или неверен.",
        };
      }
      return {
        ok: false,
        reason: "error",
        message: (body as { error?: string }).error,
      };
    }

    const parsed = parseGeocodeResponse(data as GeocoderResponse, query);
    if (!parsed) {
      return { ok: false, reason: "not_found" };
    }
    return { ok: true, data: parsed };
  } catch {
    return { ok: false, reason: "error" };
  }
}

function parseGeocodeResponse(
  data: GeocoderResponse,
  fallbackAddress: string
): GeocodeResult | null {
  const members = data.response?.GeoObjectCollection?.featureMember;
  if (!members?.length) return null;

  const geoObject = members[0].GeoObject;
  if (!geoObject?.Point?.pos) return null;

  // 1.x API: Point.pos is "longitude latitude" (space-separated)
  const pos = geoObject.Point.pos.trim().split(/\s+/);
  if (pos.length < 2) return null;
  const longitude = parseFloat(pos[0]);
  const latitude = parseFloat(pos[1]);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

  const meta = geoObject.metaDataProperty?.GeocoderMetaData;
  const formattedAddress = meta?.text ?? fallbackAddress;
  const rawComponents = meta?.Address?.Components;
  const components = parseAddressComponents(rawComponents);

  return {
    latitude,
    longitude,
    formattedAddress,
    components,
  };
}

/**
 * Обратное геокодирование — координаты в структурированный адрес
 * ВНИМАНИЕ: обязательно делать debounce/throttle вызова reverseGeocode на уровне компонента!
 * (сюда не добавлен debounce — это делает UI-код, пример для React: lodash.debounce/recoil selector и т.д.)
 * Это критично для лимита Яндекса.
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<ReverseGeocodeResult | null> {
  try {
    // Клиент ходит только на свой API
    const response = await fetch("/api/reverse-geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as GeocoderResponse;
    const members = data.response?.GeoObjectCollection?.featureMember;
    if (!members?.length) return null;

    const geoObject = members[0].GeoObject;
    const meta = geoObject?.metaDataProperty?.GeocoderMetaData;
    const formattedAddress = meta?.text ?? null;
    if (!formattedAddress) return null;

    const rawComponents = meta?.Address?.Components;
    const components = parseAddressComponents(rawComponents);

    return {
      formattedAddress,
      components,
    };
  } catch {
    return null;
  }
}
