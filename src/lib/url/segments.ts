import type { PropertyType } from "@/types/property";
import { REGION_REGISTRY, type RegionName } from "@/lib/regions";

type RegionApiValue = RegionName;
/** Тип сделки в URL/API: роль объявления (один к одному с API). */
type DealApiValue = "SALE" | "BUY" | "RENT_OUT" | "RENT_IN" | "DAILY" | "EXCHANGE";
type SearchParamValue = string | number | boolean | null | undefined;

/** Path-сегмент категории «Новостройки» → фильтр newBuilding в API (единый идентификатор сценария). */
export const NEW_BUILDING_CATEGORY_SLUG = "novostroyki";

export function categoryPathImpliesNewBuilding(categorySlug: string): boolean {
  return categorySlug === NEW_BUILDING_CATEGORY_SLUG;
}

export const REGION_MAP = {
  all: { label: "Все регионы", apiValue: undefined },
  ...Object.fromEntries(
    REGION_REGISTRY.map(
      (r) => [r.slug, { label: r.labelRu, apiValue: r.frontend }] as const
    )
  ),
} as Record<string, { label: string; apiValue: RegionApiValue | undefined }>;

/**
 * REGION_NAME_TO_SLUG — объект для сопоставления русского названия региона (label) со слагом (ключом) региона.
 * Используется для поиска слага по названию региона на русском языке.
 */
export const REGION_NAME_TO_SLUG: Record<string, string> = {
  "Все регионы": "all",
  ...Object.fromEntries(REGION_REGISTRY.map((r) => [r.labelRu, r.slug] as const)),
};

export const CATEGORY_MAP = {
  nedvizhimost: { label: "Недвижимость", apiType: undefined },
  kvartiry: { label: "Квартиры", apiType: "apartment" },
  doma: { label: "Дома", apiType: "house" },
  uchastki: { label: "Участки", apiType: "land" },
  kommercheskaya_nedvizhimost: {
    label: "Коммерческая недвижимость",
    apiType: "commercial",
  },
  // Новостройки: отдельный path-сегмент; фильтр newBuilding=true задаётся в query (см. buildSearchUrl).
  novostroyki: { label: "Новостройки", apiType: undefined },
  // transport: { label: "Транспорт", apiType: undefined },
  // elektronika: { label: "Электроника", apiType: undefined },
} as const satisfies Record<string, { label: string; apiType: PropertyType | undefined }>;

/** Слаг (path) → значение API. Каждый слаг = роль объявления (один к одному с API). */
export const DEAL_TYPE_MAP: Record<string, string> = {
  prodam: "SALE",
  kuplyu: "BUY",
  sdam: "RENT_OUT",
  snimu: "RENT_IN",
  posutochno: "DAILY",
  obmen: "EXCHANGE",
};

export const API_TYPE_TO_SLUG: Record<PropertyType, string> = {
  apartment: "kvartiry",
  house: "doma",
  land: "uchastki",
  commercial: "kommercheskaya_nedvizhimost",
};

/** Обратный маппинг: API значение → слаг. */
export const API_DEAL_TO_SLUG: Record<string, string> = {
  SALE: "prodam",
  BUY: "kuplyu",
  RENT_OUT: "sdam",
  RENT_IN: "snimu",
  DAILY: "posutochno",
  EXCHANGE: "obmen",
};

/** Слаг → лейбл для метаданных (title). prodam = «На продажу» для UX (пользователь нажал «Купить»). */
export const DEAL_SLUG_LABELS: Record<string, string> = {
  prodam: "На продажу",
  kuplyu: "Куплю",
  sdam: "Сдам в аренду",
  snimu: "Сниму жильё",
  posutochno: "Посуточно",
  obmen: "Обмен",
};

export const API_REGION_TO_SLUG: Record<RegionApiValue, string> = REGION_REGISTRY.reduce(
  (acc, row) => {
    acc[row.frontend as RegionApiValue] = row.slug;
    return acc;
  },
  {} as Record<RegionApiValue, string>
);

export interface BuildSearchUrlInput {
  region: string;
  category: string;
  dealType?: string;
  params?: Record<string, SearchParamValue>;
}

export function buildSearchUrl({
  region,
  category,
  dealType,
  params,
}: BuildSearchUrlInput): string {
  const pathSegments = [region, category, dealType].filter((segment): segment is string =>
    Boolean(segment && segment.trim())
  );
  const pathname = `/${pathSegments.map((segment) => encodeURIComponent(segment)).join("/")}`;

  if (!params) return pathname;

  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value == null) return;
    const normalized = String(value).trim();
    if (!normalized) return;
    query.set(key, normalized);
  });

  const queryString = query.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

function normalizeTypeApiValue(value: string): string {
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case "apartment":
      return "apartment";
    case "house":
      return "house";
    case "land":
      return "land";
    case "commercial":
      return "commercial";
    default:
      return normalized;
  }
}

export function categorySlugFromType(apiType: string): string {
  const normalized = normalizeTypeApiValue(apiType);
  return API_TYPE_TO_SLUG[normalized as PropertyType] ?? "nedvizhimost";
}

/** API-значение типа сделки (SALE, RENT_OUT, …) → слаг для path. */
export function dealTypeSlugFromApi(apiDeal?: string): string {
  if (!apiDeal) return "";
  return API_DEAL_TO_SLUG[apiDeal] ?? "";
}

export function regionSlugFromApi(apiRegion: string): string {
  const t = apiRegion.trim();
  const lower = t.toLowerCase();
  const row = REGION_REGISTRY.find(
    (r) => r.frontend === t || r.frontend.toLowerCase() === lower
  );
  return row ? row.slug : "all";
}

export interface ParsedSearchSegments {
  /** undefined для path "all" — не передавать region в API (все регионы) */
  apiRegion: RegionApiValue | undefined;
  apiType: PropertyType | undefined;
  /** SALE | BUY | RENT_OUT | RENT_IN | DAILY | EXCHANGE */
  apiDeal: DealApiValue | undefined;
}

export function parseSegments(
  region: string,
  category: string,
  dealType?: string
): ParsedSearchSegments | null {
  const regionEntry = REGION_MAP[region];
  const categoryEntry = CATEGORY_MAP[category as keyof typeof CATEGORY_MAP];

  if (!regionEntry || !categoryEntry) {
    return null;
  }

  const apiDeal = dealType ? DEAL_TYPE_MAP[dealType] : undefined;
  if (dealType && !apiDeal) {
    return null;
  }

  return {
    apiRegion: regionEntry.apiValue ?? undefined,
    apiType: categoryEntry.apiType,
    apiDeal: apiDeal as DealApiValue | undefined,
  };
}

export interface ParsedSearchPathname {
  region: string;
  category: string;
  dealType?: string;
}

export function parseSearchPathname(pathname: string): ParsedSearchPathname | null {
  const [region, category, dealType, ...rest] = pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!region || !category || rest.length > 0) {
    return null;
  }

  if (!(region in REGION_MAP)) {
    return null;
  }
  if (!(category in CATEGORY_MAP)) {
    return null;
  }
  if (dealType && !DEAL_TYPE_MAP[dealType]) {
    return null;
  }

  return { region, category, dealType };
}

export function isSearchPathname(pathname: string): boolean {
  return parseSearchPathname(pathname) !== null;
}
