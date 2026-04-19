import { NextRequest, NextResponse } from "next/server";
import {
  getClientIp,
  checkGeocodeRateLimit,
  recordGeocodeRequest,
} from "../_lib/geocode-utils";
import { dadataSuggestAddress, allSuggestionsWithGeo } from "../_lib/dadata-address";

/**
 * POST /api/suggest-address
 * Подсказки адреса (DaData) для автодополнения. Тело: { query: string }.
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
      return NextResponse.json({ error: "Параметр query обязателен" }, { status: 400 });
    }

    if (!process.env.DADATA_API_TOKEN?.trim()) {
      return NextResponse.json(
        {
          error: "Не настроен DaData (DADATA_API_TOKEN).",
          code: "GEOCODER_FORBIDDEN",
        },
        { status: 503 }
      );
    }

    let json;
    try {
      json = await dadataSuggestAddress(query, 12);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "DADATA_AUTH_MISSING" || msg === "DADATA_AUTH_FORBIDDEN") {
        return NextResponse.json(
          {
            error: "DaData: проверьте DADATA_API_TOKEN и DADATA_SECRET_KEY.",
            code: "GEOCODER_FORBIDDEN",
          },
          { status: 503 }
        );
      }
      throw e;
    }

    const suggestions = allSuggestionsWithGeo(json);
    recordGeocodeRequest(ip);
    return NextResponse.json({ suggestions });
  } catch (e) {
    console.error("[suggest-address]", e);
    return NextResponse.json(
      { error: "Не удалось получить подсказки." },
      { status: 500 }
    );
  }
}
