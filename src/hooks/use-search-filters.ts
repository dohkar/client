import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  parseSearchParams,
  mergeSearchParams,
  buildSearchParams,
  type SearchFiltersDisplay,
} from "@/lib/search-params";
import { SEARCH_CONSTANTS } from "@/lib/search-constants";
import { ROUTES } from "@/constants";

/**
 * Лёгкий хук: только парсит URL и возвращает фильтры (без draft/update).
 * Для использования в Header и других местах, где нужны только распарсенные фильтры.
 */
export function useParsedSearchFilters(): SearchFiltersDisplay {
  const searchParams = useSearchParams();
  return useMemo(
    () => parseSearchParams(searchParams).filters,
    [searchParams]
  );
}

/**
 * Ошибки валидации цен
 */
export interface PriceValidationErrors {
  priceMin?: string;
  priceMax?: string;
}

type FilterKey = keyof SearchFiltersDisplay;

interface UseSearchFiltersReturn {
  /** Применённые фильтры (из URL — единственный источник истины) */
  appliedFilters: SearchFiltersDisplay;

  /** Draft-состояния для полей с debounce */
  draftQuery: string;
  draftPriceMin: string;
  draftPriceMax: string;
  draftAreaMin: string;

  setDraftQuery: (query: string) => void;
  setDraftPriceMin: (value: string) => void;
  setDraftPriceMax: (value: string) => void;
  setDraftAreaMin: (value: string) => void;

  /** Обновить фильтры (пишет в URL). replace: не создавать запись в history. resetPage: сбросить page в 1 при изменении фильтров. */
  updateFilters: (
    updates: Partial<SearchFiltersDisplay>,
    options?: { replace?: boolean; resetPage?: boolean }
  ) => void;

  /** Сбросить все фильтры (переход на pathname без query) */
  resetFilters: () => void;

  /** Удалить один фильтр по ключу */
  removeFilter: (key: FilterKey) => void;

  /** Обработчики для фильтров (сразу пишут в URL) */
  handleTypeChange: (type: SearchFiltersDisplay["type"]) => void;
  handleRegionChange: (region: SearchFiltersDisplay["region"]) => void;
  handleRoomsChange: (rooms: number | null) => void;
  handleSortChange: (sortBy: SearchFiltersDisplay["sortBy"]) => void;
  handleAreaMinChange: (areaMin: number | null) => void;
  handleAreaMinBlur: () => void;
  handlePriceMinBlur: () => void;
  handlePriceMaxBlur: () => void;

  handleTypeReset: () => void;
  handlePriceReset: () => void;
  handleRegionReset: () => void;
  handleRoomsReset: () => void;
  handleAreaReset: () => void;
  handleResetAll: () => void;

  priceErrors: PriceValidationErrors;
  currentPage: number;
  setCurrentPage: (page: number) => void;

  /** true во время перехода после updateFilters/resetFilters (для loading UI) */
  isPending: boolean;
}

function validatePrices(
  min: string,
  max: string
): PriceValidationErrors {
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

export function useSearchFilters(): UseSearchFiltersReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  /** Фильтры из URL — единственный источник истины */
  const parsed = useMemo(() => parseSearchParams(searchParams), [searchParams]);
  const appliedFilters = parsed.filters;
  const currentPage = appliedFilters.page;

  /** Редирект на чистый URL при невалидных параметрах (только на странице поиска) */
  useEffect(() => {
    if (!parsed.invalid || !searchParams.toString() || pathname !== ROUTES.search) return;
    if (typeof window !== "undefined") {
      router.replace(pathname, { scroll: false });
    }
  }, [parsed.invalid, searchParams, pathname, router]);

  /** Draft-состояния для полей с debounce */
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

  /** Синхронизация draft с URL при навигации (назад/вперёд) */
  useEffect(() => {
    setDraftQueryState(appliedFilters.query);
    setDraftPriceMinState(
      appliedFilters.priceMin != null ? String(appliedFilters.priceMin) : ""
    );
    setDraftPriceMaxState(
      appliedFilters.priceMax != null ? String(appliedFilters.priceMax) : ""
    );
    setDraftAreaMinState(
      appliedFilters.areaMin != null ? String(appliedFilters.areaMin) : ""
    );
  }, [appliedFilters.query, appliedFilters.priceMin, appliedFilters.priceMax, appliedFilters.areaMin]);

  /** Обновить URL */
  const updateFilters = useCallback(
    (
      updates: Partial<SearchFiltersDisplay>,
      options?: { replace?: boolean; resetPage?: boolean }
    ) => {
      const { replace = true, resetPage = true } = options ?? {};
      const newParams = mergeSearchParams(searchParams, updates, resetPage);
      const url = `${pathname}?${newParams.toString()}`;

      startTransition(() => {
        if (replace) {
          router.replace(url, { scroll: false });
        } else {
          router.push(url, { scroll: false });
        }
      });
    },
    [pathname, router, searchParams]
  );

  const resetFilters = useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [pathname, router]);

  const removeFilter = useCallback(
    (key: FilterKey) => {
      const next = new URLSearchParams(searchParams);
      next.delete(key);
      const url = next.toString() ? `${pathname}?${next.toString()}` : pathname;
      startTransition(() => {
        router.replace(url, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  /** Debounce refs */
  const queryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceMinDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceMaxDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const areaMinDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      const num = trimmed ? (Number(trimmed) || null) : null;
      if (num !== null && (num < 0 || (appliedFilters.priceMax != null && num > appliedFilters.priceMax))) {
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
    [appliedFilters.priceMin, appliedFilters.priceMax, draftPriceMax, updateFilters]
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
      const num = trimmed ? (Number(trimmed) || null) : null;
      if (num !== null && (num < 0 || (appliedFilters.priceMin != null && num < appliedFilters.priceMin))) {
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
    [appliedFilters.priceMin, appliedFilters.priceMax, draftPriceMin, updateFilters]
  );

  const applyDraftAreaMin = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      const num = trimmed ? (Number(trimmed) || null) : null;
      if (num !== null && num < 0) return;
      if (num !== appliedFilters.areaMin) {
        updateFilters({ areaMin: num }, { resetPage: false });
      }
    },
    [appliedFilters.areaMin, updateFilters]
  );

  /** Debounce: draft → URL */
  useEffect(() => {
    if (queryDebounceRef.current) clearTimeout(queryDebounceRef.current);
    const trimmed = draftQuery.trim();
    if (trimmed === appliedFilters.query) return;
    queryDebounceRef.current = setTimeout(() => {
      applyDraftQuery(draftQuery);
    }, SEARCH_CONSTANTS.DEBOUNCE_DELAY);
    return () => {
      if (queryDebounceRef.current) clearTimeout(queryDebounceRef.current);
    };
  }, [draftQuery, appliedFilters.query, applyDraftQuery]);

  useEffect(() => {
    if (priceMinDebounceRef.current) clearTimeout(priceMinDebounceRef.current);
    if (draftPriceMin === "") {
      if (appliedFilters.priceMin !== null) {
        updateFilters({ priceMin: null });
      }
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
    if (draftPriceMax === "") {
      if (appliedFilters.priceMax !== null) {
        updateFilters({ priceMax: null });
      }
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
    if (draftAreaMin === "") {
      if (appliedFilters.areaMin !== null) {
        updateFilters({ areaMin: null }, { resetPage: false });
      }
      return;
    }
    areaMinDebounceRef.current = setTimeout(() => {
      applyDraftAreaMin(draftAreaMin);
    }, SEARCH_CONSTANTS.DEBOUNCE_DELAY);
    return () => {
      if (areaMinDebounceRef.current) clearTimeout(areaMinDebounceRef.current);
    };
  }, [draftAreaMin, appliedFilters.areaMin, applyDraftAreaMin, updateFilters]);

  const handleTypeChange = useCallback(
    (type: SearchFiltersDisplay["type"]) => {
      updateFilters({ type });
    },
    [updateFilters]
  );
  const handleRegionChange = useCallback(
    (region: SearchFiltersDisplay["region"]) => {
      updateFilters({ region });
    },
    [updateFilters]
  );
  const handleRoomsChange = useCallback(
    (rooms: number | null) => {
      updateFilters({ roomsMin: rooms });
    },
    [updateFilters]
  );
  const handleSortChange = useCallback(
    (sortBy: SearchFiltersDisplay["sortBy"]) => {
      updateFilters({ sortBy }, { resetPage: false });
    },
    [updateFilters]
  );
  const handleAreaMinChange = useCallback(
    (areaMin: number | null) => {
      updateFilters({ areaMin }, { resetPage: false });
    },
    [updateFilters]
  );

  const handleAreaMinBlur = useCallback(() => {
    if (areaMinDebounceRef.current) {
      clearTimeout(areaMinDebounceRef.current);
      areaMinDebounceRef.current = null;
    }
    applyDraftAreaMin(draftAreaMin);
  }, [draftAreaMin, applyDraftAreaMin]);

  const handlePriceMinBlur = useCallback(() => {
    if (priceMinDebounceRef.current) {
      clearTimeout(priceMinDebounceRef.current);
      priceMinDebounceRef.current = null;
    }
    applyDraftPriceMin(draftPriceMin);
  }, [draftPriceMin, applyDraftPriceMin]);

  const handlePriceMaxBlur = useCallback(() => {
    if (priceMaxDebounceRef.current) {
      clearTimeout(priceMaxDebounceRef.current);
      priceMaxDebounceRef.current = null;
    }
    applyDraftPriceMax(draftPriceMax);
  }, [draftPriceMax, applyDraftPriceMax]);

  const handleTypeReset = useCallback(() => updateFilters({ type: "all" }), [updateFilters]);
  const handlePriceReset = useCallback(() => {
    updateFilters({ priceMin: null, priceMax: null });
    setDraftPriceMinState("");
    setDraftPriceMaxState("");
    setPriceErrors({});
  }, [updateFilters]);
  const handleRegionReset = useCallback(() => updateFilters({ region: "all" }), [updateFilters]);
  const handleRoomsReset = useCallback(() => updateFilters({ roomsMin: null }), [updateFilters]);
  const handleAreaReset = useCallback(() => {
    updateFilters({ areaMin: null }, { resetPage: false });
    setDraftAreaMinState("");
  }, [updateFilters]);
  const handleResetAll = useCallback(() => {
    resetFilters();
    setDraftQueryState("");
    setDraftPriceMinState("");
    setDraftPriceMaxState("");
    setDraftAreaMinState("");
    setPriceErrors({});
  }, [resetFilters]);

  const setCurrentPage = useCallback(
    (page: number) => {
      if (typeof page === "number" && page > 0 && page !== currentPage) {
        updateFilters({ page }, { resetPage: false });
      }
    },
    [currentPage, updateFilters]
  );

  return {
    appliedFilters,
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
    removeFilter,
    handleTypeChange,
    handleRegionChange,
    handleRoomsChange,
    handleSortChange,
    handleAreaMinChange,
    handleAreaMinBlur,
    handlePriceMinBlur,
    handlePriceMaxBlur,
    handleTypeReset,
    handlePriceReset,
    handleRegionReset,
    handleRoomsReset,
    handleAreaReset,
    handleResetAll,
    priceErrors,
    currentPage,
    setCurrentPage,
    isPending,
  };
}
