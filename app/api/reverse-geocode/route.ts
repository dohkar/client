import { NextRequest, NextResponse } from "next/server";
import {
  getClientIp,
  checkGeocodeRateLimit,
  recordGeocodeRequest,
  getReverseGeocodeCached,
  setReverseGeocodeCached,
} from "../_lib/geocode-utils";
import { dadataGeolocateAddress, firstSuggestionWithGeo } from "../_lib/dadata-address";

/**
 * POST /api/reverse-geocode
 * Прокси к DaData Geolocate: координаты → адрес.
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

    if (!process.env.DADATA_API_TOKEN?.trim()) {
      return NextResponse.json(
        {
          error:
            "Не настроен DaData: задайте DADATA_API_TOKEN (и при необходимости DADATA_SECRET_KEY).",
          code: "GEOCODER_FORBIDDEN",
        },
        { status: 503 }
      );
    }

    let json;
    try {
      json = await dadataGeolocateAddress(lat, lon);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "DADATA_AUTH_MISSING" || msg === "DADATA_AUTH_FORBIDDEN") {
        return NextResponse.json(
          {
            error:
              "DaData отклонил запрос: проверьте DADATA_API_TOKEN и DADATA_SECRET_KEY.",
            code: "GEOCODER_FORBIDDEN",
          },
          { status: 503 }
        );
      }
      throw e;
    }

    const geo = firstSuggestionWithGeo(json);
    if (!geo) {
      return NextResponse.json(
        { error: "Не удалось определить адрес по координатам." },
        { status: 404 }
      );
    }

    const payload = {
      formattedAddress: geo.formattedAddress,
      components: geo.components,
    };

    recordGeocodeRequest(ip);
    setReverseGeocodeCached(lat, lon, payload);
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[reverse-geocode]", e);
    return NextResponse.json(
      { error: "Не удалось определить адрес по координатам." },
      { status: 500 }
    );
  }
}
