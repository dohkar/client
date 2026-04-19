import { NextRequest, NextResponse } from "next/server";
import {
  getClientIp,
  checkGeocodeRateLimit,
  recordGeocodeRequest,
} from "../_lib/geocode-utils";
import { dadataSuggestAddress, firstSuggestionWithGeo } from "../_lib/dadata-address";

/**
 * POST /api/geocode
 * Прокси к DaData Suggest: адрес (строка) → координаты и компоненты.
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

    if (!process.env.DADATA_API_TOKEN?.trim()) {
      return NextResponse.json(
        {
          error:
            "Не настроен DaData: задайте DADATA_API_TOKEN (и при необходимости DADATA_SECRET_KEY) в окружении.",
          code: "GEOCODER_FORBIDDEN",
        },
        { status: 503 }
      );
    }

    let json;
    try {
      json = await dadataSuggestAddress(query);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "DADATA_AUTH_MISSING" || msg === "DADATA_AUTH_FORBIDDEN") {
        return NextResponse.json(
          {
            error:
              "DaData отклонил запрос: проверьте DADATA_API_TOKEN и DADATA_SECRET_KEY в личном кабинете dadata.ru.",
            code: "GEOCODER_FORBIDDEN",
          },
          { status: 503 }
        );
      }
      throw e;
    }

    const payload = firstSuggestionWithGeo(json);
    if (!payload) {
      return NextResponse.json(
        { error: "Адрес не найден или для него нет координат в DaData." },
        { status: 404 }
      );
    }

    recordGeocodeRequest(ip);
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[geocode]", e);
    return NextResponse.json(
      { error: "Не удалось определить координаты. Проверьте адрес." },
      { status: 500 }
    );
  }
}
