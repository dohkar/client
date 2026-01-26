/**
 * Утилита для геокодирования адресов через Yandex Maps API
 * Преобразует адрес в координаты (широта, долгота)
 */

interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

/**
 * Геокодирование адреса через Yandex Maps Geocoder API
 * @param address - адрес для геокодирования
 * @param apiKey - опциональный API ключ Yandex Maps
 * @returns координаты и отформатированный адрес
 */
export async function geocodeAddress(
  address: string,
  apiKey?: string
): Promise<GeocodeResult | null> {
  if (!address || address.trim().length < 3) {
    return null;
  }

  try {
    // Используем Yandex Geocoder HTTP API
    // Примечание: для Geocoder API используется другой endpoint и формат ключа
    const apiKeyParam = apiKey ? `&apikey=${apiKey}` : "";
    const url = `https://geocode-maps.yandex.ru/1.x/?format=json&geocode=${encodeURIComponent(address)}${apiKeyParam}&lang=ru_RU&results=1`;

    const response = await fetch(url);
    
    if (!response.ok) {
      // Если 403, возможно нужен другой API ключ или настройки
      if (response.status === 403) {
        console.warn("Геокодирование: 403 ошибка. Попробуйте без API ключа или проверьте настройки.");
        // Пробуем без ключа
        if (apiKey) {
          const urlWithoutKey = `https://geocode-maps.yandex.ru/1.x/?format=json&geocode=${encodeURIComponent(address)}&lang=ru_RU&results=1`;
          const retryResponse = await fetch(urlWithoutKey);
          if (!retryResponse.ok) {
            return null;
          }
          const retryData = await retryResponse.json();
          return parseGeocodeResponse(retryData, address);
        }
      }
      console.error("Ошибка геокодирования:", response.status);
      return null;
    }

    const data = await response.json();
    return parseGeocodeResponse(data, address);
  } catch (error) {
    console.error("Ошибка при геокодировании адреса:", error);
    return null;
  }
}

/**
 * Парсинг ответа геокодера
 */
function parseGeocodeResponse(data: any, fallbackAddress: string): GeocodeResult | null {
  // Проверяем наличие результатов
  if (
    !data.response?.GeoObjectCollection?.featureMember ||
    data.response.GeoObjectCollection.featureMember.length === 0
  ) {
    return null;
  }

  // Берем первый результат
  const geoObject = data.response.GeoObjectCollection.featureMember[0].GeoObject;
  const pos = geoObject.Point.pos.split(" "); // Формат: "долгота широта"
  const longitude = parseFloat(pos[0]);
  const latitude = parseFloat(pos[1]);
  
  // Проверяем валидность координат
  if (isNaN(latitude) || isNaN(longitude)) {
    return null;
  }

  const formattedAddress = geoObject.metaDataProperty?.GeocoderMetaData?.text || fallbackAddress;

  return {
    latitude,
    longitude,
    formattedAddress,
  };
}

/**
 * Обратное геокодирование - преобразование координат в адрес
 * @param latitude - широта
 * @param longitude - долгота
 * @param apiKey - опциональный API ключ Yandex Maps
 * @returns адрес
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  apiKey?: string
): Promise<string | null> {
  try {
    const apiKeyParam = apiKey ? `&apikey=${apiKey}` : "";
    const url = `https://geocode-maps.yandex.ru/1.x/?format=json&geocode=${longitude},${latitude}${apiKeyParam}&lang=ru_RU`;

    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (
      !data.response?.GeoObjectCollection?.featureMember ||
      data.response.GeoObjectCollection.featureMember.length === 0
    ) {
      return null;
    }

    const geoObject = data.response.GeoObjectCollection.featureMember[0].GeoObject;
    return geoObject.metaDataProperty?.GeocoderMetaData?.text || null;
  } catch (error) {
    console.error("Ошибка при обратном геокодировании:", error);
    return null;
  }
}
