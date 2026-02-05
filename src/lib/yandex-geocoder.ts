/**
 * Утилита для геокодирования адресов через Yandex Maps API
 * Структурированный ввод (регион, город, улица, дом) и разбор компонентов из ответа
 */

/** Структурированный адрес для геокодирования — собираем строку запроса сами */
export interface StructuredAddressInput {
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
 * Формат: "город, улица дом" (регион добавляется при необходимости)
 */
function buildGeocodeQuery(input: StructuredAddressInput): string {
  const parts: string[] = [];
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
 */
function parseAddressComponents(
  components: Array<{ kind?: string; name?: string }> | undefined
): AddressComponents {
  const result: AddressComponents = {};
  if (!Array.isArray(components)) return result;

  const byKind = (k: string) => components.find((c) => c.kind === k)?.name;

  const province = byKind("province") ?? byKind("area");
  if (province) result.region = province;

  const locality = byKind("locality") ?? byKind("district");
  if (locality) result.city = locality;

  const street = byKind("street");
  if (street) result.street = street;

  const house = byKind("house");
  if (house) result.house = house;

  return result;
}

/**
 * Геокодирование структурированного адреса
 * @param input - регион, город, улица, дом — строка запроса собирается внутри
 * @param apiKey - опциональный API ключ Yandex Maps
 */
export async function geocodeAddress(
  input: StructuredAddressInput,
  apiKey?: string
): Promise<GeocodeResult | null> {
  const query = buildGeocodeQuery(input);
  if (!query || query.length < 3) {
    return null;
  }

  try {
    const apiKeyParam = apiKey ? `&apikey=${apiKey}` : "";
    const url = `https://geocode-maps.yandex.ru/1.x/?format=json&geocode=${encodeURIComponent(query)}${apiKeyParam}&lang=ru_RU&results=1`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 403 && apiKey) {
        const urlWithoutKey = `https://geocode-maps.yandex.ru/1.x/?format=json&geocode=${encodeURIComponent(query)}&lang=ru_RU&results=1`;
        const retryResponse = await fetch(urlWithoutKey);
        if (!retryResponse.ok) return null;
        const retryData = (await retryResponse.json()) as GeocoderResponse;
        return parseGeocodeResponse(retryData, query);
      }
      return null;
    }

    const data = (await response.json()) as GeocoderResponse;
    return parseGeocodeResponse(data, query);
  } catch {
    return null;
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

  const pos = geoObject.Point.pos.split(" ");
  const longitude = parseFloat(pos[0]);
  const latitude = parseFloat(pos[1]);
  if (isNaN(latitude) || isNaN(longitude)) return null;

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
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  apiKey?: string
): Promise<ReverseGeocodeResult | null> {
  try {
    const apiKeyParam = apiKey ? `&apikey=${apiKey}` : "";
    const url = `https://geocode-maps.yandex.ru/1.x/?format=json&geocode=${longitude},${latitude}${apiKeyParam}&lang=ru_RU`;

    const response = await fetch(url);
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
