/** Подсказки и геолокация адресов DaData (Suggestions API 4.1) */

export const DADATA_SUGGEST_ADDRESS_URL =
  "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address";

export const DADATA_GEOLOCATE_ADDRESS_URL =
  "https://suggestions.dadata.ru/suggestions/api/4_1/rs/geolocate/address";

export interface AddressComponentsPayload {
  region?: string;
  city?: string;
  street?: string;
  house?: string;
}

/** Унифицированный ответ для клиента (адрес → координаты) */
export interface GeocodeSuccessPayload {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  components: AddressComponentsPayload;
}

interface DadataSuggestion {
  value: string;
  unrestricted_value?: string;
  data?: Record<string, unknown>;
}

interface DadataSuggestResponse {
  suggestions?: DadataSuggestion[];
}

export function getDadataHeaders(): Record<string, string> | null {
  const token = process.env.DADATA_API_TOKEN?.trim();
  if (!token) return null;
  const secret = process.env.DADATA_SECRET_KEY?.trim();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Token ${token}`,
  };
  if (secret) headers["X-Secret"] = secret;
  return headers;
}

function str(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

function parseGeo(s: DadataSuggestion): GeocodeSuccessPayload | null {
  const data = s.data;
  if (!data || typeof data !== "object") return null;

  const latRaw = str(data.geo_lat);
  const lonRaw = str(data.geo_lon);
  if (!latRaw || !lonRaw) return null;
  const latitude = Number(latRaw.replace(",", "."));
  const longitude = Number(lonRaw.replace(",", "."));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const region = str(data.region_with_type) ?? str(data.region);
  const city =
    str(data.city_with_type) ??
    str(data.city) ??
    str(data.settlement_with_type) ??
    str(data.settlement);
  const street = str(data.street_with_type) ?? str(data.street);
  const house =
    [str(data.house_type_full), str(data.house)].filter(Boolean).join(" ").trim() ||
    str(data.house) ||
    undefined;

  const formattedAddress = (s.unrestricted_value ?? s.value).trim();
  if (!formattedAddress) return null;

  const components: AddressComponentsPayload = {};
  if (region) components.region = region;
  if (city) components.city = city;
  if (street) components.street = street;
  if (house) components.house = house;

  return {
    latitude,
    longitude,
    formattedAddress,
    components,
  };
}

export function firstSuggestionWithGeo(
  json: DadataSuggestResponse
): GeocodeSuccessPayload | null {
  const list = json.suggestions;
  if (!Array.isArray(list)) return null;
  for (const item of list) {
    const parsed = parseGeo(item);
    if (parsed) return parsed;
  }
  return null;
}

export async function dadataSuggestAddress(
  query: string,
  count = 7
): Promise<DadataSuggestResponse> {
  const headers = getDadataHeaders();
  if (!headers) throw new Error("DADATA_AUTH_MISSING");

  const response = await fetch(DADATA_SUGGEST_ADDRESS_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, count }),
    next: { revalidate: 0 },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("DADATA_AUTH_FORBIDDEN");
  }
  if (!response.ok) {
    throw new Error(`DADATA_HTTP_${response.status}`);
  }
  return (await response.json()) as DadataSuggestResponse;
}

export async function dadataGeolocateAddress(
  lat: number,
  lon: number,
  count = 5,
  radiusMeters = 200
): Promise<DadataSuggestResponse> {
  const headers = getDadataHeaders();
  if (!headers) throw new Error("DADATA_AUTH_MISSING");

  const response = await fetch(DADATA_GEOLOCATE_ADDRESS_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      lat,
      lon,
      count,
      radius_meters: radiusMeters,
    }),
    next: { revalidate: 0 },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("DADATA_AUTH_FORBIDDEN");
  }
  if (!response.ok) {
    throw new Error(`DADATA_HTTP_${response.status}`);
  }
  return (await response.json()) as DadataSuggestResponse;
}
