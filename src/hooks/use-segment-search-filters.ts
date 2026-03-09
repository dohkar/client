"use client";

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { SearchFiltersDisplay } from "@/lib/search-params";
import { SEARCH_CONSTANTS } from "@/lib/search-constants";
import {
  API_REGION_TO_SLUG,
  buildSearchUrl,
  categorySlugFromType,
  dealTypeSlugFromApi,
  parseSegments,
} from "@/lib/url/segments";
import { useUserRegion } from "@/hooks/use-user-region";

const emptyFn = () => () => {};
const returnTrue = () => true;
const returnFalse = () => false;

function useIsHydrated(): boolean {
  return useSyncExternalStore(emptyFn, returnTrue, returnFalse);
}

export interface PriceValidationErrors {
  priceMin?: string;
  priceMax?: string;
}

interface SegmentParamsInput {
  region: string;
  category: string;
  dealType?: string;
}

interface SegmentSearchFiltersReturn {
  appliedFilters: SearchFiltersDisplay;
  /** Чип региона показывать только когда пользователь явно выбрал не дефолтный регион (path !== userRegionSlug). */
  showRegionChip: boolean;
  draftQuery: string;
  draftPriceMin: string;
  draftPriceMax: string;
  draftAreaMin: string;
  setDraftQuery: (query: string) => void;
  setDraftPriceMin: (value: string) => void;
  setDraftPriceMax: (value: string) => void;
  setDraftAreaMin: (value: string) => void;
  updateFilters: (
    updates: Partial<SearchFiltersDisplay>,
    options?: { replace?: boolean; resetPage?: boolean }
  ) => void;
  resetFilters: () => void;
  handleTypeChange: (type: SearchFiltersDisplay["type"]) => void;
  handleRegionChange: (region: SearchFiltersDisplay["region"]) => void;
  handleRoomsChange: (rooms: number | null) => void;
  handleSortChange: (sortBy: SearchFiltersDisplay["sortBy"]) => void;
  handleAreaMinChange: (areaMin: number | null) => void;
  handleAreaMinBlur: () => void;
  handlePriceMinBlur: () => void;
  handlePriceMaxBlur: () => void;
  handleCityChange: (cityId: string | null) => void;
  handleCityReset: () => void;
  handleTypeReset: () => void;
  handlePriceReset: () => void;
  handleRegionReset: () => void;
  handleRoomsReset: () => void;
  handleAreaReset: () => void;
  handleQueryReset: () => void;
  handleDealTypeChange: (dealType: SearchFiltersDisplay["dealType"]) => void;
  handleDealTypeReset: () => void;
  handleFloorReset: () => void;
  handleResetAll: () => void;
  priceErrors: PriceValidationErrors;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  isPending: boolean;
  searchUrl: string;
}

function parseNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function parseSort(
  value: string | null
): "price-asc" | "price-desc" | "date-desc" | "relevance" {
  if (
    value === "price-asc" ||
    value === "price-desc" ||
    value === "date-desc" ||
    value === "relevance"
  ) {
    return value;
  }
  return "relevance";
}

function regionDisplayToSlug(
  region: SearchFiltersDisplay["region"],
  fallbackRegionSlug: string
): string {
  if (region === "all") return fallbackRegionSlug;
  return API_REGION_TO_SLUG[region] ?? fallbackRegionSlug;
}

function validatePrices(min: string, max: string): PriceValidationErrors {
  const errors: PriceValidationErrors = {};
  const minNum = min.trim() ? Number(min.trim()) : null;
  const maxNum = max.trim() ? Number(max.trim()) : null;

  if (minNum !== null && maxNum !== null && minNum > maxNum) {
    errors.priceMin = "Минимальная цена не может быть больше максимальной";
    errors.priceMax = "Максимальная цена не может быть меньше минимальной";
  }
  if (minNum !== null && minNum < 0) {
    errors.priceMin = "Цена не может быть отрицательной";
  }
  if (maxNum !== null && maxNum < 0) {
    errors.priceMax = "Цена не может быть отрицательной";
  }
  return errors;
}

export function useSegmentSearchFilters(
  params: SegmentParamsInput,
  searchParamsInput?: Record<string, string | string[] | undefined> | URLSearchParams
): SegmentSearchFiltersReturn {
  const router = useRouter();
  const liveSearchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const userRegionSlug = useUserRegion();
  const isHydrated = useIsHydrated();

  const parsedSegments = useMemo(
    () => parseSegments(params.region, params.category, params.dealType),
    [params.category, params.dealType, params.region]
  );

  const fallbackSearchParams = useMemo(() => {
    if (searchParamsInput instanceof URLSearchParams) return searchParamsInput;
    const next = new URLSearchParams();
    if (!searchParamsInput) return next;
    Object.entries(searchParamsInput).forEach(([key, value]) => {
      if (value == null) return;
      if (Array.isArray(value)) {
        const [first] = value;
        if (first) next.set(key, first);
        return;
      }
      next.set(key, value);
    });
    return next;
  }, [searchParamsInput]);

  // До гидрации — fallback из серверных пропсов (избегаем mismatch). После гидрации — всегда liveSearchParams.
  const activeSearchParams = isHydrated ? liveSearchParams : fallbackSearchParams;

  const appliedFilters = useMemo<SearchFiltersDisplay>(() => {
    const dealType: SearchFiltersDisplay["dealType"] =
      (parsedSegments?.apiDeal as SearchFiltersDisplay["dealType"] | undefined) ?? "all";
    const regionFromQuery = activeSearchParams.get("region");
    const region: SearchFiltersDisplay["region"] =
      regionFromQuery === "all" || parsedSegments?.apiRegion === undefined
        ? "all"
        : parsedSegments.apiRegion;

    return {
      query: activeSearchParams.get("query")?.trim() ?? "",
      dealType,
      type: parsedSegments?.apiType ?? "all",
      priceMin: parseNumber(activeSearchParams.get("price_min")),
      priceMax: parseNumber(activeSearchParams.get("price_max")),
      roomsMin: parseNumber(activeSearchParams.get("rooms")),
      areaMin: parseNumber(activeSearchParams.get("area_min")),
      floorMin: parseNumber(activeSearchParams.get("floor_min")),
      floorMax: parseNumber(activeSearchParams.get("floor_max")),
      floorNotFirst:
        activeSearchParams.get("floor_not_first") === "1" ||
        activeSearchParams.get("floor_not_first") === "true"
          ? true
          : null,
      region,
      cityId: activeSearchParams.get("cityId")?.trim() || null,
      sortBy: parseSort(activeSearchParams.get("sort")),
      page: Math.max(parseNumber(activeSearchParams.get("page")) ?? 1, 1),
      limit: 12,
    };
  }, [
    activeSearchParams,
    parsedSegments?.apiDeal,
    parsedSegments?.apiRegion,
    parsedSegments?.apiType,
  ]);

  const showRegionChip = params.region !== userRegionSlug;

  const [draftQuery, setDraftQueryState] = useState(appliedFilters.query);
  const [draftPriceMin, setDraftPriceMinState] = useState(
    appliedFilters.priceMin != null ? String(appliedFilters.priceMin) : ""
  );
  const [draftPriceMax, setDraftPriceMaxState] = useState(
    appliedFilters.priceMax != null ? String(appliedFilters.priceMax) : ""
  );
  const [draftAreaMin, setDraftAreaMinState] = useState(
    appliedFilters.areaMin != null ? String(appliedFilters.areaMin) : ""
  );
  const [priceErrors, setPriceErrors] = useState<PriceValidationErrors>({});

  /** Синхронизация draft с URL при навигации назад/вперёд — по одному эффекту на поле. */
  /* eslint-disable react-hooks/set-state-in-effect -- Sync draft from URL on back/forward; one render per field is acceptable. */
  useEffect(() => {
    setDraftQueryState(appliedFilters.query ?? "");
  }, [appliedFilters.query]);
  useEffect(() => {
    setDraftPriceMinState(
      appliedFilters.priceMin != null ? String(appliedFilters.priceMin) : ""
    );
  }, [appliedFilters.priceMin]);
  useEffect(() => {
    setDraftPriceMaxState(
      appliedFilters.priceMax != null ? String(appliedFilters.priceMax) : ""
    );
  }, [appliedFilters.priceMax]);
  useEffect(() => {
    setDraftAreaMinState(
      appliedFilters.areaMin != null ? String(appliedFilters.areaMin) : ""
    );
  }, [appliedFilters.areaMin]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const buildUrlFromFilters = useCallback(
    (filters: SearchFiltersDisplay): string => {
      const currentRegionSlug = params.region || "ingushetiya";
      const nextRegionSlug =
        filters.region === "all"
          ? "all"
          : regionDisplayToSlug(filters.region, currentRegionSlug);
      const nextCategorySlug =
        filters.type === "all" ? "nedvizhimost" : categorySlugFromType(filters.type);
      const nextDealTypeSlug =
        filters.dealType && filters.dealType !== "all"
          ? dealTypeSlugFromApi(filters.dealType)
          : undefined;

      const queryParams: Record<string, string | number | undefined> = {
        query: filters.query.trim() || undefined,
        cityId: filters.cityId?.trim() || undefined,
        price_min: filters.priceMin ?? undefined,
        price_max: filters.priceMax ?? undefined,
        rooms: filters.roomsMin ?? undefined,
        area_min: filters.areaMin ?? undefined,
        floor_min: filters.floorMin ?? undefined,
        floor_max: filters.floorMax ?? undefined,
        floor_not_first: filters.floorNotFirst ? "1" : undefined,
        sort: filters.sortBy !== "relevance" ? filters.sortBy : undefined,
        page: filters.page > 1 ? filters.page : undefined,
      };
      return buildSearchUrl({
        region: nextRegionSlug,
        category: nextCategorySlug,
        dealType: nextDealTypeSlug,
        params: queryParams,
      });
    },
    [params.region]
  );

  const updateFilters = useCallback(
    (
      updates: Partial<SearchFiltersDisplay>,
      options?: { replace?: boolean; resetPage?: boolean }
    ) => {
      const { replace = true, resetPage = true } = options ?? {};
      const merged: SearchFiltersDisplay = {
        ...appliedFilters,
        ...updates,
      };

      const shouldResetPage =
        resetPage &&
        Object.keys(updates).some((key) => key !== "page" && key !== "sortBy") &&
        updates.page === undefined;
      if (shouldResetPage) {
        merged.page = 1;
      }

      const url = buildUrlFromFilters(merged);
      startTransition(() => {
        if (replace) {
          router.replace(url, { scroll: false });
        } else {
          router.push(url, { scroll: false });
        }
      });
    },
    [appliedFilters, buildUrlFromFilters, router]
  );

  const resetFilters = useCallback(() => {
    // Сброс на базовый поиск: регион пользователя + «Недвижимость» (все типы), без типа сделки.
    // Иначе при текущем path /ingushetiya/kvartiry/prodam мы бы строили тот же URL и чипсы не исчезали.
    const cleanUrl = buildSearchUrl({
      region: userRegionSlug,
      category: "nedvizhimost",
    });
    startTransition(() => {
      router.push(cleanUrl, { scroll: false });
    });
  }, [userRegionSlug, router]);

  const queryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceMinDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceMaxDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const areaMinDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAllDebounces = useCallback(() => {
    const refs = [
      queryDebounceRef,
      priceMinDebounceRef,
      priceMaxDebounceRef,
      areaMinDebounceRef,
    ];
    refs.forEach((ref) => {
      if (ref.current) {
        clearTimeout(ref.current);
        ref.current = null;
      }
    });
  }, []);

  const applyDraftQuery = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (trimmed !== appliedFilters.query) {
        updateFilters({ query: trimmed });
      }
    },
    [appliedFilters.query, updateFilters]
  );

  const applyDraftPriceMin = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      const errs = validatePrices(trimmed, draftPriceMax);
      if (Object.keys(errs).length > 0) {
        setPriceErrors(errs);
        return;
      }
      setPriceErrors({});
      const num = trimmed ? Number(trimmed) || null : null;
      if (
        num !== null &&
        (num < 0 || (appliedFilters.priceMax != null && num > appliedFilters.priceMax))
      ) {
        setPriceErrors({
          priceMin: "Минимальная цена не может быть больше максимальной",
          priceMax: "Максимальная цена не может быть меньше минимальной",
        });
        return;
      }
      if (num !== appliedFilters.priceMin) {
        updateFilters({ priceMin: num });
      }
    },
    [appliedFilters.priceMax, appliedFilters.priceMin, draftPriceMax, updateFilters]
  );

  const applyDraftPriceMax = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      const errs = validatePrices(draftPriceMin, trimmed);
      if (Object.keys(errs).length > 0) {
        setPriceErrors(errs);
        return;
      }
      setPriceErrors({});
      const num = trimmed ? Number(trimmed) || null : null;
      if (
        num !== null &&
        (num < 0 || (appliedFilters.priceMin != null && num < appliedFilters.priceMin))
      ) {
        setPriceErrors({
          priceMin: "Минимальная цена не может быть больше максимальной",
          priceMax: "Максимальная цена не может быть меньше минимальной",
        });
        return;
      }
      if (num !== appliedFilters.priceMax) {
        updateFilters({ priceMax: num });
      }
    },
    [appliedFilters.priceMax, appliedFilters.priceMin, draftPriceMin, updateFilters]
  );

  const applyDraftAreaMin = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      const num = trimmed ? Number(trimmed) || null : null;
      if (num !== null && num < 0) return;
      if (num !== appliedFilters.areaMin) {
        updateFilters({ areaMin: num }, { resetPage: false });
      }
    },
    [appliedFilters.areaMin, updateFilters]
  );

  useEffect(() => {
    if (queryDebounceRef.current) clearTimeout(queryDebounceRef.current);
    const trimmed = draftQuery.trim();
    if (trimmed === (appliedFilters.query ?? "")) return;
    queryDebounceRef.current = setTimeout(() => {
      applyDraftQuery(draftQuery);
    }, SEARCH_CONSTANTS.DEBOUNCE_DELAY);
    return () => {
      if (queryDebounceRef.current) clearTimeout(queryDebounceRef.current);
    };
  }, [draftQuery, appliedFilters.query, applyDraftQuery]);

  useEffect(() => {
    if (priceMinDebounceRef.current) clearTimeout(priceMinDebounceRef.current);
    if (draftPriceMin === "" && appliedFilters.priceMin === null) return;
    if (draftPriceMin !== "" && Number(draftPriceMin) === appliedFilters.priceMin) return;
    if (draftPriceMin === "") {
      updateFilters({ priceMin: null });
      return;
    }
    priceMinDebounceRef.current = setTimeout(() => {
      applyDraftPriceMin(draftPriceMin);
    }, SEARCH_CONSTANTS.DEBOUNCE_DELAY);
    return () => {
      if (priceMinDebounceRef.current) clearTimeout(priceMinDebounceRef.current);
    };
  }, [draftPriceMin, appliedFilters.priceMin, applyDraftPriceMin, updateFilters]);

  useEffect(() => {
    if (priceMaxDebounceRef.current) clearTimeout(priceMaxDebounceRef.current);
    if (draftPriceMax === "" && appliedFilters.priceMax === null) return;
    if (draftPriceMax !== "" && Number(draftPriceMax) === appliedFilters.priceMax) return;
    if (draftPriceMax === "") {
      updateFilters({ priceMax: null });
      return;
    }
    priceMaxDebounceRef.current = setTimeout(() => {
      applyDraftPriceMax(draftPriceMax);
    }, SEARCH_CONSTANTS.DEBOUNCE_DELAY);
    return () => {
      if (priceMaxDebounceRef.current) clearTimeout(priceMaxDebounceRef.current);
    };
  }, [draftPriceMax, appliedFilters.priceMax, applyDraftPriceMax, updateFilters]);

  useEffect(() => {
    if (areaMinDebounceRef.current) clearTimeout(areaMinDebounceRef.current);
    if (draftAreaMin === "" && appliedFilters.areaMin === null) return;
    if (draftAreaMin !== "" && Number(draftAreaMin) === appliedFilters.areaMin) return;
    if (draftAreaMin === "") {
      updateFilters({ areaMin: null }, { resetPage: false });
      return;
    }
    areaMinDebounceRef.current = setTimeout(() => {
      applyDraftAreaMin(draftAreaMin);
    }, SEARCH_CONSTANTS.DEBOUNCE_DELAY);
    return () => {
      if (areaMinDebounceRef.current) clearTimeout(areaMinDebounceRef.current);
    };
  }, [draftAreaMin, appliedFilters.areaMin, applyDraftAreaMin, updateFilters]);

  const handleAreaMinBlur = useCallback(() => {
    if (areaMinDebounceRef.current) {
      clearTimeout(areaMinDebounceRef.current);
      areaMinDebounceRef.current = null;
    }
    applyDraftAreaMin(draftAreaMin);
  }, [applyDraftAreaMin, draftAreaMin]);

  const handlePriceMinBlur = useCallback(() => {
    if (priceMinDebounceRef.current) {
      clearTimeout(priceMinDebounceRef.current);
      priceMinDebounceRef.current = null;
    }
    applyDraftPriceMin(draftPriceMin);
  }, [applyDraftPriceMin, draftPriceMin]);

  const handlePriceMaxBlur = useCallback(() => {
    if (priceMaxDebounceRef.current) {
      clearTimeout(priceMaxDebounceRef.current);
      priceMaxDebounceRef.current = null;
    }
    applyDraftPriceMax(draftPriceMax);
  }, [applyDraftPriceMax, draftPriceMax]);

  const handleResetAll = useCallback(() => {
    clearAllDebounces();
    setDraftQueryState("");
    setDraftPriceMinState("");
    setDraftPriceMaxState("");
    setDraftAreaMinState("");
    setPriceErrors({});
    resetFilters();
  }, [clearAllDebounces, resetFilters]);

  const currentPage = appliedFilters.page;

  return {
    appliedFilters,
    showRegionChip,
    draftQuery,
    draftPriceMin,
    draftPriceMax,
    draftAreaMin,
    setDraftQuery: setDraftQueryState,
    setDraftPriceMin: setDraftPriceMinState,
    setDraftPriceMax: setDraftPriceMaxState,
    setDraftAreaMin: setDraftAreaMinState,
    updateFilters,
    resetFilters,
    handleTypeChange: (type) => updateFilters({ type }),
    handleRegionChange: (region) => updateFilters({ region, cityId: null }),
    handleRoomsChange: (rooms) => updateFilters({ roomsMin: rooms }),
    handleSortChange: (sortBy) => updateFilters({ sortBy }, { resetPage: false }),
    handleAreaMinChange: (areaMin) => updateFilters({ areaMin }, { resetPage: false }),
    handleAreaMinBlur,
    handlePriceMinBlur,
    handlePriceMaxBlur,
    handleCityChange: (cityId) => updateFilters({ cityId: cityId || null }),
    handleCityReset: () => updateFilters({ cityId: null }),
    handleTypeReset: () => updateFilters({ type: "all" }),
    handlePriceReset: () => {
      updateFilters({ priceMin: null, priceMax: null });
      setDraftPriceMinState("");
      setDraftPriceMaxState("");
      setPriceErrors({});
    },
    handleRegionReset: () => updateFilters({ region: "all", cityId: null }),
    handleRoomsReset: () => updateFilters({ roomsMin: null }),
    handleAreaReset: () => {
      updateFilters({ areaMin: null }, { resetPage: false });
      setDraftAreaMinState("");
    },
    handleQueryReset: () => {
      updateFilters({ query: "" });
      setDraftQueryState("");
    },
    handleDealTypeChange: (dealType) => updateFilters({ dealType }),
    handleDealTypeReset: () => updateFilters({ dealType: "all" }),
    handleFloorReset: () =>
      updateFilters({
        floorMin: null,
        floorMax: null,
        floorNotFirst: null,
      }),
    handleResetAll,
    priceErrors,
    currentPage,
    setCurrentPage: (page) => {
      if (page > 0 && page !== currentPage) {
        updateFilters({ page }, { resetPage: false });
      }
    },
    isPending,
    searchUrl: buildUrlFromFilters(appliedFilters),
  };
}
