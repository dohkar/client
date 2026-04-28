import { REGION_LABELS } from "@/lib/search-constants";

/** Убираем почтовый индекс из начала строки адреса: "386100, ..." -> "..." */
export function stripPostalCodePrefix(text: string): string {
  return text.replace(/^\s*\d{6}\s*,?\s*/u, "").trim();
}

export function getRegionLabel(region?: string | null): string | undefined {
  if (!region) return undefined;
  const trimmed = String(region).trim();
  if (!trimmed) return undefined;
  return REGION_LABELS[trimmed] ?? trimmed;
}

export function formatListingLocationLine(input: {
  location?: string | null;
  city?: string | null;
  region?: string | null;
  street?: string | null;
  house?: string | null;
}): string {
  const regionLabel = getRegionLabel(input.region);
  const parts = [
    input.location ? stripPostalCodePrefix(String(input.location)) : "",
    input.street ?? "",
    input.house ?? "",
    input.city ?? "",
    regionLabel ?? "",
  ].filter((p) => Boolean(p && String(p).trim()));

  return parts.length > 0 ? parts.join(" · ") : "Адрес не указан";
}
