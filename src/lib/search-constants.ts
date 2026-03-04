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
  all: "Любая недвижимость",
  apartment: "Квартиры",
  house: "Дома и дачи",
  land: "Земельные участки",
  commercial: "Коммерческая",
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
  relevance: "Сначала лучшие",
  "price-asc": "Сначала дешевле",
  "price-desc": "Сначала дороже",
  "date-desc": "Новые объявления",
};

/**
 * Опции сортировки для селекта
 */
export const SORT_OPTIONS = [
  { value: "relevance", label: "Сначала лучшие" },
  { value: "price-asc", label: "Сначала дешевле" },
  { value: "price-desc", label: "Сначала дороже" },
  { value: "date-desc", label: "Новые объявления" },
] as const;

/**
 * Опции типов недвижимости для селекта
 */
export const PROPERTY_TYPE_OPTIONS = [
  { value: "all", label: "Любая недвижимость" },
  { value: "apartment", label: "Квартиры" },
  { value: "house", label: "Дома и дачи" },
  { value: "land", label: "Земельные участки" },
  { value: "commercial", label: "Коммерческая" },
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
 * Лейблы для типа сделки (поиск)
 */
export const DEAL_TYPE_LABELS: Record<string, string> = {
  all: "Любая сделка",
  SALE: "Продам",
  BUY: "Куплю",
  RENT_OUT: "Сдам в аренду",
  RENT_IN: "Сниму жильё",
  EXCHANGE: "Обмен",
};

/**
 * Опции типа сделки для селекта поиска
 */
export const SEARCH_DEAL_TYPE_OPTIONS = [
  { value: "all", label: "Любая сделка" },
  { value: "SALE", label: "Продам" },
  { value: "BUY", label: "Куплю" },
  { value: "RENT_OUT", label: "Сдам в аренду" },
  { value: "RENT_IN", label: "Сниму жильё" },
  { value: "EXCHANGE", label: "Обмен" },
] as const;

/**
 * Опции количества комнат для селекта
 */
export const ROOMS_OPTIONS = [
  { value: "all", label: "Комнаты" },
  { value: "0", label: "Студия" },
  { value: "1", label: "1 комната" },
  { value: "2", label: "2 комнаты" },
  { value: "3", label: "3 комнаты" },
  { value: "4", label: "4 и более" },
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
      priceMax: 5_000_000,
      priceMin: null,
      roomsMin: null,
      region: "all",
    },
  },
  {
    label: "Просторные дома",
    filters: {
      type: "house",
      roomsMin: 4,
      priceMin: null,
      priceMax: null,
      region: "all",
    },
  },
  {
    label: "Земля под застройку",
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
