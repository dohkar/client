import type { PropertyFilters } from "@/stores";
import {
  PROPERTY_TYPE_LABELS,
  REGION_LABELS,
  SORT_LABELS,
} from "@/lib/search-constants";

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

export function getPriceLabel(filters: PropertyFilters): string {
  if (filters.priceMin && filters.priceMax) {
    return `${filters.priceMin.toLocaleString()} - ${filters.priceMax.toLocaleString()} ₽`;
  }
  if (filters.priceMin) {
    return `от ${filters.priceMin.toLocaleString()} ₽`;
  }
  if (filters.priceMax) {
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
