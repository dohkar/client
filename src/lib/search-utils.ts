import type { PropertyFilters } from "@/stores";
import type { PropertySearchParams, PropertyType } from "@/types/property";

/**
 * Нормализует фильтры для сравнения (приводит к единому формату)
 */
function normalizeFiltersForComparison(
  filters: PropertyFilters | PropertySearchParams
): {
  query: string;
  type: PropertyType | "all" | undefined;
  priceMin: number | null;
  priceMax: number | null;
  roomsMin: number | null;
  areaMin: number | null;
  region: "Chechnya" | "Ingushetia" | "Other" | "all" | undefined;
  sortBy: "price-asc" | "price-desc" | "date-desc" | "relevance" | undefined;
} {
  // Проверяем, является ли это PropertyFilters (имеет roomsMin)
  if ("roomsMin" in filters) {
    const propFilters = filters as PropertyFilters;
    return {
      query: propFilters.query || "",
      type: propFilters.type === "all" ? undefined : propFilters.type,
      priceMin: propFilters.priceMin ?? null,
      priceMax: propFilters.priceMax ?? null,
      roomsMin: propFilters.roomsMin ?? null,
      areaMin: propFilters.areaMin ?? null,
      region: propFilters.region === "all" ? undefined : propFilters.region,
      sortBy: propFilters.sortBy === "relevance" ? undefined : propFilters.sortBy,
    };
  }

  // Если это PropertySearchParams (имеет rooms вместо roomsMin)
  const params = filters as PropertySearchParams;
  return {
    query: params.query || "",
    type: params.type,
    priceMin: params.priceMin ?? null,
    priceMax: params.priceMax ?? null,
    roomsMin: params.rooms ?? null,
    areaMin: params.areaMin ?? null,
    region: params.region,
    sortBy: params.sortBy,
  };
}

/**
 * Сравнивает фильтры PropertyFilters с PropertySearchParams
 * Нормализует оба значения перед сравнением для корректной работы
 */
export function areFiltersEqual(
  a: PropertyFilters,
  b: PropertySearchParams
): boolean {
  const normalizedA = normalizeFiltersForComparison(a);
  const normalizedB = normalizeFiltersForComparison(b);

  return (
    normalizedA.query === normalizedB.query &&
    normalizedA.type === normalizedB.type &&
    normalizedA.priceMin === normalizedB.priceMin &&
    normalizedA.priceMax === normalizedB.priceMax &&
    normalizedA.roomsMin === normalizedB.roomsMin &&
    normalizedA.areaMin === normalizedB.areaMin &&
    normalizedA.region === normalizedB.region &&
    normalizedA.sortBy === normalizedB.sortBy
  );
}

/**
 * Преобразует PropertySearchParams в PropertyFilters
 * Правильно обрабатывает undefined значения (не заменяет на дефолты, если значение не задано)
 */
export function searchParamsToFilters(
  params: PropertySearchParams
): Partial<PropertyFilters> {
  const result: Partial<PropertyFilters> = {};

  // Query - только если задан
  if (params.query !== undefined) {
    result.query = params.query || "";
  }

  // Type - только если задан
  if (params.type !== undefined) {
    result.type = params.type || "all";
  }

  // Region - только если задан
  if (params.region !== undefined) {
    result.region = params.region || "all";
  }

  // PriceMin - всегда устанавливаем (null если не задан)
  result.priceMin = params.priceMin ?? null;

  // PriceMax - всегда устанавливаем (null если не задан)
  result.priceMax = params.priceMax ?? null;

  // RoomsMin - всегда устанавливаем (null если не задан)
  result.roomsMin = params.rooms ?? null;

  // AreaMin - всегда устанавливаем (null если не задан)
  result.areaMin = params.areaMin ?? null;

  // SortBy - только если задан
  if (params.sortBy !== undefined) {
    result.sortBy = params.sortBy || "relevance";
  }

  return result;
}

/**
 * Парсит параметры фильтра из URLSearchParams в объект PropertySearchParams
 * Правильно обрабатывает пустые строки, undefined и null
 */
export function getFiltersFromSearchParams(
  searchParams: URLSearchParams
): PropertySearchParams {
  const result: PropertySearchParams = {};

  // Парсинг query - только если не пустая строка
  const queryParam = searchParams.get("query");
  if (queryParam && queryParam.trim().length > 0) {
    result.query = queryParam.trim();
  }

  // Парсинг type - только если не "all"
  const typeParam = searchParams.get("type");
  if (typeParam && typeParam !== "all") {
    const validTypes: PropertyType[] = ["apartment", "house", "land", "commercial"];
    if (validTypes.includes(typeParam as PropertyType)) {
      result.type = typeParam as PropertyType;
    }
  }

  // Парсинг region - только если не "all"
  const regionParam = searchParams.get("region");
  if (regionParam && regionParam !== "all") {
    const validRegions: ("Chechnya" | "Ingushetia" | "Other")[] = [
      "Chechnya",
      "Ingushetia",
      "Other",
    ];
    if (validRegions.includes(regionParam as "Chechnya" | "Ingushetia" | "Other")) {
      result.region = regionParam as "Chechnya" | "Ingushetia" | "Other";
    }
  }

  // Парсинг чисел с правильной обработкой пустых строк и "0"
  const parseNullableNumber = (val: string | null | undefined): number | null => {
    if (val === null || val === undefined || val === "") {
      return null;
    }
    const num = Number(val);
    // Проверяем, что это валидное число и не NaN
    if (isNaN(num) || !isFinite(num)) {
      return null;
    }
    // 0 - валидное значение, не игнорируем его
    return num;
  };

  const priceMin = parseNullableNumber(searchParams.get("priceMin"));
  const priceMax = parseNullableNumber(searchParams.get("priceMax"));
  const rooms = parseNullableNumber(searchParams.get("roomsMin"));
  const areaMin = parseNullableNumber(searchParams.get("areaMin"));

  if (priceMin !== null) result.priceMin = priceMin;
  if (priceMax !== null) result.priceMax = priceMax;
  if (rooms !== null) result.rooms = rooms;
  if (areaMin !== null) result.areaMin = areaMin;

  // Парсинг sortBy - только если не "relevance"
  const sortByParam = searchParams.get("sortBy");
  if (sortByParam && sortByParam !== "relevance") {
    const validSorts: ("price-asc" | "price-desc" | "date-desc")[] = [
      "price-asc",
      "price-desc",
      "date-desc",
    ];
    if (validSorts.includes(sortByParam as "price-asc" | "price-desc" | "date-desc")) {
      result.sortBy = sortByParam as "price-asc" | "price-desc" | "date-desc";
    }
  }

  return result;
}

/**
 * Собирает параметры поиска для API запроса
 */
export function buildApiSearchParams(
  filters: PropertyFilters,
  currentPage: number,
  itemsPerPage: number
): PropertySearchParams {
  const params: PropertySearchParams = {
    sortBy: filters.sortBy,
    page: currentPage,
    limit: itemsPerPage,
  };

  if (filters.query && filters.query.trim().length > 0)
    params.query = filters.query.trim();
  if (filters.type !== "all") params.type = filters.type as PropertyType;
  if (filters.priceMin !== null && filters.priceMin !== undefined)
    params.priceMin = filters.priceMin;
  if (filters.priceMax !== null && filters.priceMax !== undefined)
    params.priceMax = filters.priceMax;
  // Внимание: для roomsMin здесь устанавливается params.rooms, а не roomsMin
  if (filters.roomsMin !== null && filters.roomsMin !== undefined)
    params.rooms = filters.roomsMin;
  if (filters.areaMin !== null && filters.areaMin !== undefined)
    params.areaMin = filters.areaMin;
  if (filters.region !== "all")
    params.region = filters.region as "Chechnya" | "Ingushetia" | "Other";

  return params;
}

/**
 * Генерирует строку запроса для URL с учетом активных фильтров и текущей страницы
 * Не добавляет пустые или дефолтные значения в URL
 */
export function buildSearchUrl(
  filters: PropertyFilters,
  currentPage: number,
  pathname: string
): string {
  const params = new URLSearchParams();

  // Query - только если не пустой
  if (filters.query && filters.query.trim().length > 0) {
    params.set("query", filters.query.trim());
  }

  // Type - только если не "all"
  if (filters.type !== "all") {
    params.set("type", filters.type as PropertyType);
  }

  // Region - только если не "all"
  if (filters.region !== "all") {
    params.set("region", filters.region as "Chechnya" | "Ingushetia" | "Other");
  }

  // PriceMin - только если не null/undefined (0 - валидное значение!)
  if (filters.priceMin !== null && filters.priceMin !== undefined) {
    params.set("priceMin", String(filters.priceMin));
  }

  // PriceMax - только если не null/undefined
  if (filters.priceMax !== null && filters.priceMax !== undefined) {
    params.set("priceMax", String(filters.priceMax));
  }

  // RoomsMin - только если не null/undefined
  if (filters.roomsMin !== null && filters.roomsMin !== undefined) {
    params.set("roomsMin", String(filters.roomsMin));
  }

  // AreaMin - только если не null/undefined
  if (filters.areaMin !== null && filters.areaMin !== undefined) {
    params.set("areaMin", String(filters.areaMin));
  }

  // SortBy - только если не "relevance"
  if (filters.sortBy !== "relevance") {
    params.set(
      "sortBy",
      filters.sortBy as "price-asc" | "price-desc" | "date-desc"
    );
  }

  // Page - только если больше 1
  if (currentPage > 1) {
    params.set("page", String(currentPage));
  }

  const queryString = params.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

/**
 * Парсит номер страницы из URLSearchParams
 */
export function getPageFromSearchParams(
  searchParams: URLSearchParams | null
): number {
  if (!searchParams) return 1;
  const pageParam = searchParams.get("page");
  if (pageParam) {
    const page = Number(pageParam);
    return !isNaN(page) && page > 0 ? page : 1;
  }
  return 1;
}
