import { z } from "zod";
import type { PropertySearchParams, PropertyDealType } from "@/types/property";
import type { PropertyType } from "@/types/property";

/**
 * Схема валидации параметров поиска из URL.
 * URL — единственный источник истины для страницы поиска.
 */
const SearchParamsSchema = z
  .object({
    query: z.string().max(200).optional(),
    dealType: z
      .enum(["sale", "buy", "rent_out", "rent_in", "exchange", "daily"])
      .optional()
      .transform((v) => (v ? (v.toUpperCase().replace(" ", "_") as PropertyDealType | "DAILY") : undefined)),
    type: z
      .enum(["apartment", "house", "land", "commercial"])
      .optional()
      .transform((v) => v as PropertyType | undefined),
    priceMin: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.coerce
        .number()
        .min(0)
        .max(1_000_000_000)
        .optional()
        .nullable()
        .catch(null)
    ),
    priceMax: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.coerce
        .number()
        .min(0)
        .max(1_000_000_000)
        .optional()
        .nullable()
        .catch(null)
    ),
    roomsMin: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.coerce
        .number()
        .min(0)
        .max(20)
        .optional()
        .nullable()
        .catch(null)
    ),
    areaMin: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.coerce
        .number()
        .min(0)
        .max(100_000)
        .optional()
        .nullable()
        .catch(null)
    ),
    floorMin: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.coerce
        .number()
        .min(0)
        .max(200)
        .optional()
        .nullable()
        .catch(null)
    ),
    floorMax: z.preprocess(
      (v) => (v === "" ? undefined : v),
      z.coerce
        .number()
        .min(0)
        .max(200)
        .optional()
        .nullable()
        .catch(null)
    ),
    floorNotFirst: z.preprocess(
      (v) => v === "1" || v === "true",
      z.boolean().optional().nullable().catch(null)
    ),
    region: z
      .enum(["Chechnya", "Ingushetia", "Other"])
      .optional()
      .transform((v) => v as "Chechnya" | "Ingushetia" | "Other" | undefined),
    cityId: z.string().max(36).optional(),
    sortBy: z
      .enum(["price-asc", "price-desc", "date-desc", "relevance"])
      .optional()
      .default("relevance"),
    page: z.coerce.number().min(1).max(10_000).default(1),
    limit: z.coerce.number().min(1).max(100).default(12),
  })
  .refine(
    (data) => {
      const min = data.priceMin ?? 0;
      const max = data.priceMax;
      if (max == null) return true;
      return max >= min;
    },
    { message: "priceMax должен быть не меньше priceMin", path: ["priceMax"] }
  );

export type SearchParams = z.infer<typeof SearchParamsSchema>;

/** Дефолтные значения для отображения в UI (полный объект). DAILY пока не поддерживается API — в запросе не передаётся. */
export interface SearchFiltersDisplay {
  query: string;
  dealType: PropertyDealType | "DAILY" | "all";
  type: PropertyType | "all";
  priceMin: number | null;
  priceMax: number | null;
  roomsMin: number | null;
  areaMin: number | null;
  floorMin: number | null;
  floorMax: number | null;
  floorNotFirst: boolean | null;
  region: "Chechnya" | "Ingushetia" | "Other" | "all";
  cityId: string | null;
  sortBy: "price-asc" | "price-desc" | "date-desc" | "relevance";
  page: number;
  limit: number;
}

const DEFAULT_DISPLAY: SearchFiltersDisplay = {
  query: "",
  dealType: "all",
  type: "all",
  priceMin: null,
  priceMax: null,
  roomsMin: null,
  areaMin: null,
  floorMin: null,
  floorMax: null,
  floorNotFirst: null,
  region: "all",
  cityId: null,
  sortBy: "relevance",
  page: 1,
  limit: 12,
};

export interface ParseSearchParamsResult {
  filters: SearchFiltersDisplay;
  /** true, если URL содержал параметры поиска, но валидация не прошла */
  invalid: boolean;
}

/**
 * Парсит и валидирует URLSearchParams.
 * При ошибке валидации возвращает дефолтные значения и invalid: true.
 */
export function parseSearchParams(
  searchParams: URLSearchParams
): ParseSearchParamsResult {
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    raw[key] = value;
  });

  const result = SearchParamsSchema.safeParse(raw);

  if (!result.success) {
    if (Object.keys(raw).length > 0) {
      console.warn("Invalid search params:", result.error.format());
    }
    return { filters: { ...DEFAULT_DISPLAY }, invalid: Object.keys(raw).length > 0 };
  }

  const d = result.data;
  const filters: SearchFiltersDisplay = {
    query: d.query?.trim() ?? "",
    dealType: d.dealType ?? "all",
    type: (d.type ?? "all") as PropertyType | "all",
    priceMin: d.priceMin ?? null,
    priceMax: d.priceMax ?? null,
    roomsMin: d.roomsMin ?? null,
    areaMin: d.areaMin ?? null,
    floorMin: d.floorMin ?? null,
    floorMax: d.floorMax ?? null,
    floorNotFirst: d.floorNotFirst ?? null,
    region: (d.region ?? "all") as "Chechnya" | "Ingushetia" | "Other" | "all",
    cityId: d.cityId?.trim() ?? null,
    sortBy: d.sortBy ?? "relevance",
    page: d.page ?? 1,
    limit: d.limit ?? 12,
  };
  return { filters, invalid: false };
}

/**
 * Собирает объект фильтров в URLSearchParams.
 * Пустые и дефолтные значения не добавляются в URL.
 */
export function buildSearchParams(
  filters: Partial<SearchFiltersDisplay>
): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.query && filters.query.trim().length > 0) {
    params.set("query", filters.query.trim());
  }
  if (filters.dealType && filters.dealType !== "all") {
    params.set("dealType", filters.dealType.toLowerCase());
  }
  if (filters.type && filters.type !== "all") {
    params.set("type", filters.type);
  }
  if (filters.priceMin != null) {
    params.set("priceMin", String(filters.priceMin));
  }
  if (filters.priceMax != null) {
    params.set("priceMax", String(filters.priceMax));
  }
  if (filters.roomsMin != null) {
    params.set("roomsMin", String(filters.roomsMin));
  }
  if (filters.areaMin != null) {
    params.set("areaMin", String(filters.areaMin));
  }
  if (filters.floorMin != null) {
    params.set("floorMin", String(filters.floorMin));
  }
  if (filters.floorMax != null) {
    params.set("floorMax", String(filters.floorMax));
  }
  if (filters.floorNotFirst === true) {
    params.set("floorNotFirst", "1");
  }
  if (filters.region && filters.region !== "all") {
    params.set("region", filters.region);
  }
  if (filters.cityId != null && String(filters.cityId).trim().length > 0) {
    params.set("cityId", String(filters.cityId).trim());
  }
  if (filters.sortBy && filters.sortBy !== "relevance") {
    params.set("sortBy", filters.sortBy);
  }
  if (filters.page != null && filters.page > 1) {
    params.set("page", String(filters.page));
  }
  if (filters.limit != null && filters.limit !== 12) {
    params.set("limit", String(filters.limit));
  }

  return params;
}

/**
 * Объединяет текущие параметры с обновлениями.
 * При изменении фильтров (кроме page) можно сбросить страницу на 1.
 */
export function mergeSearchParams(
  current: URLSearchParams,
  updates: Partial<SearchFiltersDisplay>,
  resetPage = true
): URLSearchParams {
  const { filters: currentParsed } = parseSearchParams(current);
  const filterKeys = [
    "query",
    "dealType",
    "type",
    "priceMin",
    "priceMax",
    "roomsMin",
    "areaMin",
    "floorMin",
    "floorMax",
    "floorNotFirst",
    "region",
    "cityId",
    "sortBy",
  ] as const;
  const hasFilterChange = filterKeys.some(
    (k) => updates[k] !== undefined && updates[k] !== currentParsed[k]
  );

  const merged: Partial<SearchFiltersDisplay> = {
    ...currentParsed,
    ...updates,
  };
  if (resetPage && hasFilterChange && updates.page === undefined) {
    merged.page = 1;
  }

  return buildSearchParams(merged);
}

/**
 * Преобразует SearchFiltersDisplay в PropertySearchParams для API.
 */
export function toPropertySearchParams(
  filters: SearchFiltersDisplay,
  itemsPerPage: number
): PropertySearchParams {
  const params: PropertySearchParams = {
    page: filters.page,
    limit: itemsPerPage,
    sortBy: filters.sortBy,
  };

  if (filters.query && filters.query.trim().length > 0) {
    params.query = filters.query.trim();
  }
  if (filters.dealType && filters.dealType !== "all" && filters.dealType !== "DAILY") {
    params.dealType = filters.dealType as PropertyDealType;
  }
  if (filters.type !== "all") {
    params.type = filters.type as PropertyType;
  }
  if (filters.priceMin != null) params.priceMin = filters.priceMin;
  if (filters.priceMax != null) params.priceMax = filters.priceMax;
  if (filters.roomsMin != null) params.rooms = filters.roomsMin;
  if (filters.areaMin != null) params.areaMin = filters.areaMin;
  if (filters.floorMin != null) params.floorMin = filters.floorMin;
  if (filters.floorMax != null) params.floorMax = filters.floorMax;
  if (filters.floorNotFirst === true) params.floorNotFirst = true;
  if (filters.region !== "all") {
    params.region = filters.region as "Chechnya" | "Ingushetia" | "Other";
  }
  if (filters.cityId && filters.cityId.trim().length > 0) {
    params.cityId = filters.cityId.trim();
  }

  return params;
}
