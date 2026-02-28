import { NextRequest, NextResponse } from "next/server";
import {
  getClientIp,
  checkGeocodeRateLimit,
  recordGeocodeRequest,
} from "../_lib/geocode-utils";

const YANDEX_GEOCODER_URL = "https://geocode-maps.yandex.ru/1.x/";

/**
 * POST /api/geocode
 * Прокси к Yandex Geocoder API: адрес → координаты.
 * Тело: { query: string }.
 * Rate limit: 60 запросов/мин на IP.
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
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: "Параметр query обязателен и не должен быть пустым" },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.YANDEX_GEOCODER_API_KEY || process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "Не настроен API ключ геокодера (YANDEX_GEOCODER_API_KEY или NEXT_PUBLIC_YANDEX_MAPS_API_KEY)",
        },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      apikey: apiKey,
      geocode: query,
      format: "json",
      lang: "ru_RU",
      results: "5",
    });
    const url = `${YANDEX_GEOCODER_URL}?${params.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[geocode] Yandex error:", response.status, text);

      // 403 = ключ не подходит для HTTP Геокодера или ограничения по IP/домену
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
        { error: "Ошибка геокодера", code: "GEOCODER_ERROR", details: response.status },
        { status: 502 }
      );
    }

    const data = await response.json();
    recordGeocodeRequest(ip);
    return NextResponse.json(data);
  } catch (e) {
    console.error("[geocode]", e);
    return NextResponse.json(
      { error: "Не удалось определить координаты. Проверьте адрес." },
      { status: 500 }
    );
  }
}
