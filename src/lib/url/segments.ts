import type { PropertyType } from "@/types/property";

type RegionApiValue = "Chechnya" | "Ingushetia" | "Other";
type DealApiValue = "buy" | "rent_in" | "daily";
type SearchParamValue = string | number | boolean | null | undefined;

export const REGION_MAP = {
  all: { label: "Все регионы", apiValue: undefined },
  ingushetiya: { label: "Ингушетия", apiValue: "Ingushetia" },
  chechnya: { label: "Чечня", apiValue: "Chechnya" },
  other: { label: "Другие регионы", apiValue: "Other" },
} as const satisfies Record<
  string,
  { label: string; apiValue: RegionApiValue | undefined }
>;

/**
 * REGION_NAME_TO_SLUG — объект для сопоставления русского названия региона (label) со слагом (ключом) региона.
 * Используется для поиска слага по названию региона на русском языке.
 */
export const REGION_NAME_TO_SLUG: Record<string, string> = {
  "Все регионы": "all",
  Ингушетия: "ingushetiya",
  Чечня: "chechnya",
  "Другие регионы": "other",
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
  garazhi_i_mashinomesta: { label: "Гаражи и машиноместа", apiType: undefined },
  // Пока API не поддерживает отдельный type=newbuild, оставляем без type-фильтра.
  novostroyki: { label: "Новостройки", apiType: undefined },
} as const satisfies Record<string, { label: string; apiType: PropertyType | undefined }>;

export const DEAL_TYPE_MAP = {
  prodam: { label: "Продам", apiDeal: "buy" },
  sdam: { label: "Сдам", apiDeal: "rent_in" },
  posutochno: { label: "Посуточно", apiDeal: "daily" },
} as const satisfies Record<string, { label: string; apiDeal: DealApiValue }>;

export const API_TYPE_TO_SLUG: Record<PropertyType, string> = {
  apartment: "kvartiry",
  house: "doma",
  land: "uchastki",
  commercial: "kommercheskaya_nedvizhimost",
};

export const API_DEAL_TO_SLUG: Record<DealApiValue, string> = {
  buy: "prodam",
  rent_in: "sdam",
  daily: "posutochno",
};

export const API_REGION_TO_SLUG: Record<RegionApiValue, string> = {
  Ingushetia: "ingushetiya",
  Chechnya: "chechnya",
  Other: "other",
};

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

function normalizeDealApiValue(value: string): string {
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case "buy":
      return "buy";
    case "rent_in":
      return "rent_in";
    case "daily":
      return "daily";
    default:
      return normalized;
  }
}

export function categorySlugFromType(apiType: string): string {
  const normalized = normalizeTypeApiValue(apiType);
  return API_TYPE_TO_SLUG[normalized as PropertyType] ?? "nedvizhimost";
}

export function dealTypeSlugFromApi(apiDeal: string): string {
  const normalized = normalizeDealApiValue(apiDeal);
  return API_DEAL_TO_SLUG[normalized as DealApiValue] ?? "";
}

export function regionSlugFromApi(apiRegion: string): string {
  const normalized = apiRegion.trim().toLowerCase();
  switch (normalized) {
    case "ingushetia":
      return API_REGION_TO_SLUG.Ingushetia;
    case "chechnya":
      return API_REGION_TO_SLUG.Chechnya;
    case "other":
      return API_REGION_TO_SLUG.Other;
    default:
      return "ingushetiya";
  }
}

export interface ParsedSearchSegments {
  /** undefined для path "all" — не передавать region в API (все регионы) */
  apiRegion: RegionApiValue | undefined;
  apiType: PropertyType | undefined;
  apiDeal: DealApiValue | undefined;
}

export function parseSegments(
  region: string,
  category: string,
  dealType?: string
): ParsedSearchSegments | null {
  const regionEntry = REGION_MAP[region as keyof typeof REGION_MAP];
  const categoryEntry = CATEGORY_MAP[category as keyof typeof CATEGORY_MAP];

  if (!regionEntry || !categoryEntry) {
    return null;
  }

  if (dealType) {
    const dealEntry = DEAL_TYPE_MAP[dealType as keyof typeof DEAL_TYPE_MAP];
    if (!dealEntry) {
      return null;
    }
    return {
      apiRegion: regionEntry.apiValue ?? undefined,
      apiType: categoryEntry.apiType,
      apiDeal: dealEntry.apiDeal,
    };
  }

  return {
    apiRegion: regionEntry.apiValue ?? undefined,
    apiType: categoryEntry.apiType,
    apiDeal: undefined,
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

  if (!REGION_MAP[region as keyof typeof REGION_MAP]) {
    return null;
  }
  if (!CATEGORY_MAP[category as keyof typeof CATEGORY_MAP]) {
    return null;
  }
  if (dealType && !DEAL_TYPE_MAP[dealType as keyof typeof DEAL_TYPE_MAP]) {
    return null;
  }

  return { region, category, dealType };
}

export function isSearchPathname(pathname: string): boolean {
  return parseSearchPathname(pathname) !== null;
}
