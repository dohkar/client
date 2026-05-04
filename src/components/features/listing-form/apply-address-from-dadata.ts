import type { UseFormSetValue } from "react-hook-form";
import type { GeocodeResult, AddressComponents } from "@/lib/dadata-geocoder";
import { stripLeadingPostalCode } from "@/lib/dadata-geocoder";
import { regionsService } from "@/services/regions.service";
import type { RegionDto, CityDto } from "@/types/property";
import { REGION_BACKEND_TO_NAME } from "@/lib/regions";
import type { ListingFormData } from "./schema";

function normalizeLocPart(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Только регион и населённый пункт — без улицы и дома (автогеолокация / грубый геокод).
 */
export function buildCoarseLocationLabel(components: AddressComponents): string {
  const region = components.region?.trim();
  const city = components.city?.trim();
  if (region && city && normalizeLocPart(region) === normalizeLocPart(city)) {
    return city;
  }
  if (region && city) return `${region}, ${city}`;
  return region || city || "";
}

function normalizeGeoName(value: string): string {
  return value
    .toLowerCase()
    .replace(/^(г|пгт|село|с|п|деревня|д)\s*[.]?\s*/iu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Определяет регион формы по строке из DaData / геокодера. */
export function dadataRegionToListingRegion(
  regionText: string | undefined
): ListingFormData["region"] {
  if (!regionText) return "Other";
  const r = regionText.toLowerCase();
  if (r.includes("чечен")) return "Chechnya";
  if (r.includes("ингуш")) return "Ingushetia";
  if (r.includes("дагестан")) return "Dagestan";
  if (r.includes("московская")) return "MoscowOblast";
  if (r.includes("москва")) return "Moscow";
  if (r.includes("ленинградск")) return "LeningradOblast";
  if (r.includes("санкт-петербург") || r.includes("петербург") || r === "спб") {
    return "SaintPetersburg";
  }
  if (r.includes("краснодарск")) return "KrasnodarKrai";
  if (r.includes("ростовск")) return "RostovOblast";
  if (r.includes("татарстан")) return "Tatarstan";
  if (r.includes("свердловск")) return "SverdlovskOblast";
  if (r.includes("новосибирск")) return "NovosibirskOblast";
  return "Other";
}

export function matchCityId(cities: CityDto[], dadataCity: string | undefined): string {
  if (!dadataCity?.trim()) return "";
  const t = normalizeGeoName(dadataCity);
  if (!t) return "";
  const exact = cities.find((c) => normalizeGeoName(c.name) === t);
  if (exact) return exact.id;
  const partial = cities.find(
    (c) => normalizeGeoName(c.name).includes(t) || t.includes(normalizeGeoName(c.name))
  );
  return partial?.id ?? "";
}

/** userPick — выбор из подсказки DaData (полный адрес, без индекса; улица/дом с подсказки). autoCoarse — GPS / автогеокод: только регион+город, улицу и дом не заполняем. */
export type ApplyGeocodeMode = "userPick" | "autoCoarse";

/**
 * Записывает в форму листинга результат DaData и подбирает город в справочнике.
 */
export async function applyGeocodeResultToListingForm(
  payload: GeocodeResult,
  setValue: UseFormSetValue<ListingFormData>,
  regions: RegionDto[],
  opts?: { mode?: ApplyGeocodeMode }
): Promise<void> {
  const mode = opts?.mode ?? "userPick";
  const cleanedFormatted = stripLeadingPostalCode(payload.formattedAddress);

  setValue("realEstate.latitude", payload.latitude);
  setValue("realEstate.longitude", payload.longitude);

  if (mode === "autoCoarse") {
    const coarse = buildCoarseLocationLabel(payload.components) || cleanedFormatted;
    setValue("location", coarse);
    setValue("street", "");
    setValue("house", "");
  } else {
    setValue("location", cleanedFormatted);
    if (payload.components.street) setValue("street", payload.components.street);
    else setValue("street", "");
    if (payload.components.house) setValue("house", payload.components.house);
    else setValue("house", "");
  }

  const formRegion = dadataRegionToListingRegion(payload.components.region);
  setValue("region", formRegion);

  const backendName = regions.find(
    (reg) =>
      REGION_BACKEND_TO_NAME[reg.name as keyof typeof REGION_BACKEND_TO_NAME] ===
      formRegion
  );
  const regionId = backendName?.id;
  if (!regionId) {
    setValue("cityId", "");
    return;
  }

  const cities = await regionsService.getCities(regionId);
  const cityId = matchCityId(cities, payload.components.city);
  setValue("cityId", cityId);
}
