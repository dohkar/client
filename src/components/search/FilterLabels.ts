import {
  PROPERTY_TYPE_LABELS,
  REGION_LABELS,
  SORT_LABELS,
  DEAL_TYPE_LABELS,
} from "@/lib/search-constants";

/** Минимальный тип для отображения ценового диапазона */
interface PriceFilters {
  priceMin?: number | null;
  priceMax?: number | null;
}

/**
 * Утилиты для получения лейблов фильтров
 */
export function getTypeLabel(type: string): string {
  return PROPERTY_TYPE_LABELS[type] || "Все типы";
}

export function getRegionLabel(region: string): string {
  return REGION_LABELS[region] || "Все регионы";
}

export function getSortLabel(sortBy: string): string {
  return SORT_LABELS[sortBy] || "По популярности";
}

export function getPriceLabel(filters: PriceFilters): string {
  if (filters.priceMin != null && filters.priceMax != null) {
    return `${filters.priceMin.toLocaleString()} - ${filters.priceMax.toLocaleString()} ₽`;
  }
  if (filters.priceMin != null) {
    return `от ${filters.priceMin.toLocaleString()} ₽`;
  }
  if (filters.priceMax != null) {
    return `до ${filters.priceMax.toLocaleString()} ₽`;
  }
  return "Цена";
}

export function getRoomsLabel(roomsMin: number | null | undefined): string {
  if (roomsMin === null || roomsMin === undefined) {
    return "Комнаты";
  }
  if (roomsMin === 0) return "Студия";
  if (roomsMin >= 4) return "4+ комнат";
  return `${roomsMin} комн.`;
}

export function getAreaLabel(areaMin: number | null | undefined): string {
  if (areaMin) {
    return `от ${areaMin} м²`;
  }
  return "Площадь";
}

export function getCityLabel(cityName: string | null | undefined): string {
  return cityName?.trim() || "Город";
}

/** Лейбл для объединённого чипа «Локация» (регион и/или город) */
export function getLocationChipLabel(
  region: string,
  cityName: string | null | undefined
): string {
  const regionLabel = getRegionLabel(region);
  if (region === "all") return regionLabel;
  const name = cityName?.trim();
  return name ? `${regionLabel} · ${name}` : regionLabel;
}

export function getDealTypeLabel(dealType: string | null | undefined): string {
  if (!dealType || dealType === "all") return "Тип сделки";
  return DEAL_TYPE_LABELS[dealType] ?? dealType;
}

/** Лейбл для фильтра по этажу (активные фильтры) */
export function getFloorLabel(filters: {
  floorMin?: number | null;
  floorMax?: number | null;
  floorNotFirst?: boolean | null;
}): string {
  if (filters.floorNotFirst === true) return "Не первый этаж";
  if (filters.floorMin != null && filters.floorMax != null) {
    return `Этаж: ${filters.floorMin}–${filters.floorMax}`;
  }
  if (filters.floorMin != null) return `Этаж от ${filters.floorMin}`;
  if (filters.floorMax != null) return `Этаж до ${filters.floorMax}`;
  return "Этаж";
}
