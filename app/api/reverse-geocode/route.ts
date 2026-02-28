import { NextRequest, NextResponse } from "next/server";
import {
  getClientIp,
  checkGeocodeRateLimit,
  recordGeocodeRequest,
  getReverseGeocodeCached,
  setReverseGeocodeCached,
} from "../_lib/geocode-utils";

const YANDEX_GEOCODER_URL = "https://geocode-maps.yandex.ru/1.x/";

/**
 * POST /api/reverse-geocode
 * Прокси к Yandex Geocoder API: координаты → адрес.
 * Тело: { latitude: number, longitude: number }.
 * Кэш: 5 мин по округлённым координатам. Rate limit: 60 запросов/мин на IP.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkGeocodeRateLimit(ip)) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте через минуту." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const lat = Number(body?.latitude);
    const lon = Number(body?.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return NextResponse.json(
        { error: "Нужны числа latitude и longitude" },
        { status: 400 }
      );
    }

    const cached = getReverseGeocodeCached(lat, lon);
    if (cached !== null) {
      recordGeocodeRequest(ip);
      return NextResponse.json(cached);
    }

    const apiKey =
      process.env.YANDEX_GEOCODER_API_KEY || process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Не настроен API ключ геокодера" },
        { status: 500 }
      );
    }

    const geocode = `${lon},${lat}`;
    const params = new URLSearchParams({
      apikey: apiKey,
      geocode,
      format: "json",
      lang: "ru_RU",
      results: "1",
    });
    const url = `${YANDEX_GEOCODER_URL}?${params.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[reverse-geocode] Yandex error:", response.status, text);

      if (response.status === 403) {
        return NextResponse.json(
          {
            error:
              "Ключ API не разрешён для Геокодера или неверен. Проверьте YANDEX_GEOCODER_API_KEY и права ключа в кабинете Яндекса.",
            code: "GEOCODER_FORBIDDEN",
            details: response.status,
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: "Ошибка обратного геокодера",
          code: "GEOCODER_ERROR",
          details: response.status,
        },
        { status: 502 }
      );
    }

    const data = await response.json();
    recordGeocodeRequest(ip);
    setReverseGeocodeCached(lat, lon, data);
    return NextResponse.json(data);
  } catch (e) {
    console.error("[reverse-geocode]", e);
    return NextResponse.json(
      { error: "Не удалось определить адрес по координатам." },
      { status: 500 }
    );
  }
}
