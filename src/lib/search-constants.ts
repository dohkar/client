import type { PropertyType } from "@/types/property";

/**
 * Константы для страницы поиска
 */
export const SEARCH_CONSTANTS = {
  ITEMS_PER_PAGE: 12,
  DEBOUNCE_DELAY: 400,
  URL_UPDATE_DELAY: 100,
} as const;

/**
 * Лейблы для типов недвижимости
 */
export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  all: "Все типы",
  apartment: "Квартиры",
  house: "Дома",
  land: "Участки",
  commercial: "Коммерция",
};

/**
 * Лейблы для регионов
 */
export const REGION_LABELS: Record<string, string> = {
  all: "Все регионы",
  Chechnya: "Чечня",
  Ingushetia: "Ингушетия",
};

/**
 * Лейблы для сортировки
 */
export const SORT_LABELS: Record<string, string> = {
  relevance: "По популярности",
  "price-asc": "По цене: ↑",
  "price-desc": "По цене: ↓",
  "date-desc": "По дате",
};

/**
 * Опции сортировки для селекта
 */
export const SORT_OPTIONS = [
  { value: "relevance", label: "По популярности" },
  { value: "price-asc", label: "По цене: возрастание" },
  { value: "price-desc", label: "По цене: убывание" },
  { value: "date-desc", label: "По дате добавления" },
] as const;

/**
 * Опции типов недвижимости для селекта
 */
export const PROPERTY_TYPE_OPTIONS = [
  { value: "all", label: "Все типы" },
  { value: "apartment", label: "Квартиры" },
  { value: "house", label: "Дома" },
  { value: "land", label: "Участки" },
  { value: "commercial", label: "Коммерция" },
] as const;

/**
 * Опции регионов для селекта
 */
export const REGION_OPTIONS = [
  { value: "all", label: "Все регионы" },
  { value: "Chechnya", label: "Чечня" },
  { value: "Ingushetia", label: "Ингушетия" },
] as const;

/**
 * Опции количества комнат для селекта
 */
export const ROOMS_OPTIONS = [
  { value: "all", label: "Комнаты" },
  { value: "0", label: "Студия" },
  { value: "1", label: "1 комн." },
  { value: "2", label: "2 комн." },
  { value: "3", label: "3 комн." },
  { value: "4", label: "4+ комн." },
] as const;

/**
 * Быстрые пресеты фильтров
 */
export interface QuickPreset {
  label: string;
  filters: {
    type?: PropertyType | "all";
    priceMin?: number | null;
    priceMax?: number | null;
    roomsMin?: number | null;
    region?: "Chechnya" | "Ingushetia" | "Other" | "all";
    areaMin?: number | null;
  };
}

export const QUICK_PRESETS: QuickPreset[] = [
  {
    label: "Квартиры до 5 млн ₽",
    filters: {
      type: "apartment",
      priceMax: 5000000,
      roomsMin: null,
      priceMin: null,
      region: "all",
    },
  },
  {
    label: "Дома 4+ комнат",
    filters: {
      type: "house",
      roomsMin: 4,
      priceMin: null,
      priceMax: null,
      region: "all",
    },
  },
  {
    label: "Земельные участки",
    filters: {
      type: "land",
      region: "all",
      priceMin: null,
      priceMax: null,
      roomsMin: null,
      areaMin: null,
    },
  },
];
