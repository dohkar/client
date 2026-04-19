import type { UseFormSetValue } from "react-hook-form";
import type { GeocodeResult } from "@/lib/dadata-geocoder";
import { regionsService } from "@/services/regions.service";
import type { RegionDto, CityDto } from "@/types/property";
import { REGION_BACKEND_TO_NAME } from "@/lib/regions";
import type { ListingFormData } from "./schema";

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

/**
 * Записывает в форму листинга результат выбора адреса (DaData) и подбирает город в справочнике.
 */
export async function applyGeocodeResultToListingForm(
  payload: GeocodeResult,
  setValue: UseFormSetValue<ListingFormData>,
  regions: RegionDto[]
): Promise<void> {
  setValue("location", payload.formattedAddress);
  setValue("realEstate.latitude", payload.latitude);
  setValue("realEstate.longitude", payload.longitude);

  if (payload.components.street) setValue("street", payload.components.street);
  else setValue("street", "");
  if (payload.components.house) setValue("house", payload.components.house);
  else setValue("house", "");

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
