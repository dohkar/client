import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { PropertyFilters } from "@/stores";
import { usePropertyStore } from "@/stores";
import {
  areFiltersEqual,
  getFiltersFromSearchParams,
  getPageFromSearchParams,
  searchParamsToFilters,
  buildSearchUrl,
} from "@/lib/search-utils";
import { SEARCH_CONSTANTS } from "@/lib/search-constants";

/**
 * Ошибки валидации цен
 */
export interface PriceValidationErrors {
  priceMin?: string;
  priceMax?: string;
}

interface UseSearchFiltersReturn {
  // Applied фильтры (из store)
  appliedFilters: PropertyFilters;
  
  // Draft состояния для UI
  draftQuery: string;
  draftPriceMin: string;
  draftPriceMax: string;
  draftAreaMin: string;
  
  // Setters для draft
  setDraftQuery: (query: string) => void;
  setDraftPriceMin: (value: string) => void;
  setDraftPriceMax: (value: string) => void;
  setDraftAreaMin: (value: string) => void;
  
  // Обработчики для фильтров (сразу применяются, без debounce)
  handleTypeChange: (type: PropertyFilters["type"]) => void;
  handleRegionChange: (region: PropertyFilters["region"]) => void;
  handleRoomsChange: (rooms: number | null) => void;
  handleSortChange: (sortBy: PropertyFilters["sortBy"]) => void;
  handleAreaMinChange: (areaMin: number | null) => void;
  handleAreaMinBlur: () => void;
  
  // Обработчики для цен (с валидацией)
  handlePriceMinBlur: () => void;
  handlePriceMaxBlur: () => void;
  
  // Сбросы
  handleTypeReset: () => void;
  handlePriceReset: () => void;
  handleRegionReset: () => void;
  handleRoomsReset: () => void;
  handleAreaReset: () => void;
  handleResetAll: () => void;
  
  // Валидация цен
  priceErrors: PriceValidationErrors;
  
  // Страница
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

/**
 * Единый хук для управления фильтрами поиска с разделением draft/applied
 * 
 * Принципы:
 * - Draft = то, что пользователь вводит (локальное состояние)
 * - Applied = то, что реально влияет на запрос (в store и URL)
 * - Debounce работает только между draft → applied
 * - URL синкается ТОЛЬКО с applied
 */
export function useSearchFilters(): UseSearchFiltersReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const { filters: appliedFilters, updateFilters, resetFilters } = usePropertyStore();
  
  /**
   * Рефы для отслеживания источника изменений и предотвращения циклов
   * 
   * isInitializedRef - хук инициализирован (прочитали URL/store)
   * isUpdatingFromUrlRef - сейчас обновляем из URL (не трогаем URL)
   * isUpdatingToUrlRef - сейчас обновляем URL (не читаем из URL)
   * lastUrlRef - последний известный URL для сравнения
   * isUserTypingRef - пользователь активно вводит данные (не синхронизировать draft обратно)
   */
  const isInitializedRef = useRef(false);
  const isUpdatingFromUrlRef = useRef(false);
  const isUpdatingToUrlRef = useRef(false);
  const lastUrlRef = useRef<string>("");
  const isUserTypingRef = useRef(false);
  
  // Debounce refs
  const queryDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceMinDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceMaxDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const areaMinDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceMinTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceMaxTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Страница
  const [currentPage, setCurrentPageState] = useState(() =>
    getPageFromSearchParams(searchParams)
  );
  
  // Draft состояния
  const [draftQuery, setDraftQueryState] = useState(() => {
    const urlQuery = searchParams?.get("query");
    return urlQuery || appliedFilters.query || "";
  });
  
  const [draftPriceMin, setDraftPriceMinState] = useState(() => {
    const urlValue = searchParams?.get("priceMin");
    if (urlValue !== null && urlValue !== "" && !isNaN(Number(urlValue))) {
      return urlValue;
    }
    return appliedFilters.priceMin != null ? String(appliedFilters.priceMin) : "";
  });
  
  const [draftPriceMax, setDraftPriceMaxState] = useState(() => {
    const urlValue = searchParams?.get("priceMax");
    if (urlValue !== null && urlValue !== "" && !isNaN(Number(urlValue))) {
      return urlValue;
    }
    return appliedFilters.priceMax != null ? String(appliedFilters.priceMax) : "";
  });
  
  const [draftAreaMin, setDraftAreaMinState] = useState(() => {
    const urlValue = searchParams?.get("areaMin");
    if (urlValue !== null && urlValue !== "" && !isNaN(Number(urlValue))) {
      return urlValue;
    }
    return appliedFilters.areaMin != null ? String(appliedFilters.areaMin) : "";
  });
  
  // Валидация цен
  const [priceErrors, setPriceErrors] = useState<PriceValidationErrors>({});
  
  // Валидация цен: min <= max
  const validatePrices = useCallback((min: string, max: string): PriceValidationErrors => {
    const errors: PriceValidationErrors = {};
    
    const minNum = min.trim() ? Number(min.trim()) : null;
    const maxNum = max.trim() ? Number(max.trim()) : null;
    
    // Если оба поля заполнены, проверяем min <= max
    if (minNum !== null && maxNum !== null) {
      if (minNum > maxNum) {
        errors.priceMin = "Минимальная цена не может быть больше максимальной";
        errors.priceMax = "Максимальная цена не может быть меньше минимальной";
      }
    }
    
    // Проверка на отрицательные значения
    if (minNum !== null && minNum < 0) {
      errors.priceMin = "Цена не может быть отрицательной";
    }
    
    if (maxNum !== null && maxNum < 0) {
      errors.priceMax = "Цена не может быть отрицательной";
    }
    
    return errors;
  }, []);
  
  // Применение draft → applied с валидацией
  const applyDraftQuery = useCallback((query: string) => {
    const trimmed = query.trim();
    if (trimmed !== appliedFilters.query) {
      updateFilters({ query: trimmed });
      setCurrentPageState(1);
    }
  }, [appliedFilters.query, updateFilters]);
  
  /**
   * Универсальная функция применения диапазона цен (min/max)
   * Устраняет дублирование логики между applyDraftPriceMin и applyDraftPriceMax
   */
  const applyDraftPriceRange = useCallback((
    value: string,
    otherValue: string,
    appliedValue: number | null,
    updateKey: "priceMin" | "priceMax"
  ) => {
    const trimmed = value.trim();
    const errors = validatePrices(
      updateKey === "priceMin" ? trimmed : otherValue,
      updateKey === "priceMin" ? otherValue : trimmed
    );
    
    // Если есть ошибки валидации, не применяем
    if (errors.priceMin || errors.priceMax) {
      setPriceErrors(errors);
      return;
    }
    
    setPriceErrors({});
    
    // Если поле пустое, очищаем фильтр
    if (!trimmed) {
      if (appliedValue !== null) {
        updateFilters({ [updateKey]: null });
        setCurrentPageState(1);
      }
      return;
    }
    
    const numValue = !isNaN(Number(trimmed)) ? Number(trimmed) : null;
    
    if (numValue === null) {
      // Невалидное значение - не применяем, но и не показываем ошибку (пользователь еще вводит)
      return;
    }
    
    if (numValue !== appliedValue) {
      updateFilters({ [updateKey]: numValue });
      setCurrentPageState(1);
    }
  }, [updateFilters, validatePrices]);
  
  const applyDraftPriceMin = useCallback((value: string) => {
    applyDraftPriceRange(value, draftPriceMax, appliedFilters.priceMin, "priceMin");
  }, [draftPriceMax, appliedFilters.priceMin, applyDraftPriceRange]);
  
  const applyDraftPriceMax = useCallback((value: string) => {
    applyDraftPriceRange(value, draftPriceMin, appliedFilters.priceMax, "priceMax");
  }, [draftPriceMin, appliedFilters.priceMax, applyDraftPriceRange]);
  
  /**
   * Применение draft площади → applied
   * Площадь не сбрасывает страницу (как и сортировка)
   */
  const applyDraftAreaMin = useCallback((value: string) => {
    const trimmed = value.trim();
    
    // Если поле пустое, очищаем фильтр
    if (!trimmed) {
      if (appliedFilters.areaMin !== null) {
        updateFilters({ areaMin: null });
      }
      return;
    }
    
    const numValue = !isNaN(Number(trimmed)) ? Number(trimmed) : null;
    
    if (numValue === null || numValue < 0) {
      // Невалидное значение - не применяем
      return;
    }
    
    if (numValue !== appliedFilters.areaMin) {
      updateFilters({ areaMin: numValue });
    }
  }, [appliedFilters.areaMin, updateFilters]);
  
  /**
   * Инициализация из URL (один раз при монтировании)
   * 
   * Приоритет: URL > Store
   * Если в URL есть параметры - используем их, иначе берем из store
   */
  useEffect(() => {
    if (isInitializedRef.current) return;
    
    // Вспомогательная функция для синхронизации draft состояний
    const syncDraftStates = (filters: Partial<PropertyFilters>, page: number) => {
      setDraftQueryState(filters.query || "");
      setDraftPriceMinState(
        filters.priceMin != null ? String(filters.priceMin) : ""
      );
      setDraftPriceMaxState(
        filters.priceMax != null ? String(filters.priceMax) : ""
      );
      setDraftAreaMinState(
        filters.areaMin != null ? String(filters.areaMin) : ""
      );
      setCurrentPageState(page);
    };
    
    if (searchParams && searchParams.toString().length > 0) {
      // Есть параметры в URL - читаем их
      isUpdatingFromUrlRef.current = true;
      const urlFilters = getFiltersFromSearchParams(searchParams);
      const urlPage = getPageFromSearchParams(searchParams);
      
      const filtersToUpdate = searchParamsToFilters(urlFilters);
      updateFilters(filtersToUpdate);
      syncDraftStates(filtersToUpdate, urlPage);
      
      lastUrlRef.current = buildSearchUrl(
        { ...appliedFilters, ...filtersToUpdate } as PropertyFilters,
        urlPage,
        pathname
      );
    } else {
      // URL пустой - синхронизируем с текущим store
      syncDraftStates(appliedFilters, currentPage);
      lastUrlRef.current = pathname;
    }
    
    isInitializedRef.current = true;
    isUpdatingFromUrlRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Только при монтировании
  
  // Синхронизация URL → Store (при навигации браузером)
  useEffect(() => {
    if (!isInitializedRef.current || isUpdatingToUrlRef.current) {
      return;
    }
    
    const urlFromParams =
      pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    
    if (urlFromParams !== lastUrlRef.current) {
      const currentUrl = buildSearchUrl(appliedFilters, currentPage, pathname);
      
      if (urlFromParams !== currentUrl) {
        isUpdatingFromUrlRef.current = true;
        
        const urlFilters = getFiltersFromSearchParams(searchParams);
        const urlPage = getPageFromSearchParams(searchParams);
        
        if (!areFiltersEqual(appliedFilters, urlFilters) || currentPage !== urlPage) {
          const filtersToUpdate = searchParamsToFilters(urlFilters);
          updateFilters(filtersToUpdate);
          
          setDraftQueryState(filtersToUpdate.query || "");
          setDraftPriceMinState(
            filtersToUpdate.priceMin != null ? String(filtersToUpdate.priceMin) : ""
          );
          setDraftPriceMaxState(
            filtersToUpdate.priceMax != null ? String(filtersToUpdate.priceMax) : ""
          );
          setDraftAreaMinState(
            filtersToUpdate.areaMin != null ? String(filtersToUpdate.areaMin) : ""
          );
          setCurrentPageState(urlPage);
        }
        
        lastUrlRef.current = urlFromParams;
        
        Promise.resolve().then(() => {
          isUpdatingFromUrlRef.current = false;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pathname]);
  
  /**
   * Синхронизация Store → URL (при изменении applied фильтров)
   * 
   * Когда applied фильтры меняются (не из URL), обновляем URL
   * Флаг isUpdatingFromUrlRef предотвращает цикл: мы не обновляем URL, если читаем из него
   */
  useEffect(() => {
    if (!isInitializedRef.current || isUpdatingFromUrlRef.current) {
      return;
    }
    
    const newUrl = buildSearchUrl(appliedFilters, currentPage, pathname);
    const currentUrl =
      pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    
    // URL должен обновиться, но еще не обновился - делаем это
    if (newUrl !== currentUrl && newUrl !== lastUrlRef.current) {
      isUpdatingToUrlRef.current = true;
      lastUrlRef.current = newUrl;
      
      router.replace(newUrl, { scroll: false });
      
      // Сбрасываем флаг после того, как браузер обработал изменение
      requestAnimationFrame(() => {
        isUpdatingToUrlRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, currentPage, pathname, router]);
  
  // Debounce для query (draft → applied)
  useEffect(() => {
    if (queryDebounceRef.current) {
      clearTimeout(queryDebounceRef.current);
    }
    
    const trimmed = draftQuery.trim();
    if (trimmed === appliedFilters.query) {
      return;
    }
    
    queryDebounceRef.current = setTimeout(() => {
      if (trimmed !== appliedFilters.query) {
        applyDraftQuery(trimmed);
      }
    }, SEARCH_CONSTANTS.DEBOUNCE_DELAY);
    
    return () => {
      if (queryDebounceRef.current) {
        clearTimeout(queryDebounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftQuery]);
  
  // Debounce для priceMin (draft → applied)
  useEffect(() => {
    if (priceMinDebounceRef.current) {
      clearTimeout(priceMinDebounceRef.current);
    }
    
    // Если поле пустое, сразу очищаем фильтр (без debounce для лучшего UX)
    if (draftPriceMin === "") {
      if (appliedFilters.priceMin !== null) {
        updateFilters({ priceMin: null });
        setCurrentPageState(1);
      }
      return;
    }
    
    priceMinDebounceRef.current = setTimeout(() => {
      applyDraftPriceMin(draftPriceMin);
    }, SEARCH_CONSTANTS.DEBOUNCE_DELAY);
    
    return () => {
      if (priceMinDebounceRef.current) {
        clearTimeout(priceMinDebounceRef.current);
      }
    };
  }, [draftPriceMin, applyDraftPriceMin, appliedFilters.priceMin, updateFilters]);
  
  // Debounce для priceMax (draft → applied)
  useEffect(() => {
    if (priceMaxDebounceRef.current) {
      clearTimeout(priceMaxDebounceRef.current);
    }
    
    // Если поле пустое, сразу очищаем фильтр (без debounce для лучшего UX)
    if (draftPriceMax === "") {
      if (appliedFilters.priceMax !== null) {
        updateFilters({ priceMax: null });
        setCurrentPageState(1);
      }
      return;
    }
    
    priceMaxDebounceRef.current = setTimeout(() => {
      applyDraftPriceMax(draftPriceMax);
    }, SEARCH_CONSTANTS.DEBOUNCE_DELAY);
    
    return () => {
      if (priceMaxDebounceRef.current) {
        clearTimeout(priceMaxDebounceRef.current);
      }
    };
  }, [draftPriceMax, applyDraftPriceMax, appliedFilters.priceMax, updateFilters]);
  
  // Debounce для areaMin (draft → applied)
  useEffect(() => {
    if (areaMinDebounceRef.current) {
      clearTimeout(areaMinDebounceRef.current);
    }
    
    // Если поле пустое, сразу очищаем фильтр (без debounce для лучшего UX)
    if (draftAreaMin === "") {
      if (appliedFilters.areaMin !== null) {
        updateFilters({ areaMin: null });
      }
      return;
    }
    
    areaMinDebounceRef.current = setTimeout(() => {
      applyDraftAreaMin(draftAreaMin);
    }, SEARCH_CONSTANTS.DEBOUNCE_DELAY);
    
    return () => {
      if (areaMinDebounceRef.current) {
        clearTimeout(areaMinDebounceRef.current);
      }
    };
  }, [draftAreaMin, applyDraftAreaMin, appliedFilters.areaMin, updateFilters]);
  
  // Синхронизация draft с applied (только при изменении извне, не от debounce)
  useEffect(() => {
    if (isUpdatingFromUrlRef.current || isUserTypingRef.current) {
      return;
    }
    
    const newQuery = appliedFilters.query || "";
    if (draftQuery !== newQuery) {
      setDraftQueryState(newQuery);
    }
  }, [appliedFilters.query, draftQuery]);
  
  useEffect(() => {
    if (isUpdatingFromUrlRef.current || isUserTypingRef.current) {
      return;
    }
    
    const newPriceMin = appliedFilters.priceMin != null ? String(appliedFilters.priceMin) : "";
    if (draftPriceMin !== newPriceMin) {
      setDraftPriceMinState(newPriceMin);
    }
  }, [appliedFilters.priceMin, draftPriceMin]);
  
  useEffect(() => {
    if (isUpdatingFromUrlRef.current || isUserTypingRef.current) {
      return;
    }
    
    const newPriceMax = appliedFilters.priceMax != null ? String(appliedFilters.priceMax) : "";
    if (draftPriceMax !== newPriceMax) {
      setDraftPriceMaxState(newPriceMax);
    }
  }, [appliedFilters.priceMax, draftPriceMax]);
  
  // Обработчики для фильтров (сразу применяются)
  const handleTypeChange = useCallback((type: PropertyFilters["type"]) => {
    updateFilters({ type });
    setCurrentPageState(1);
  }, [updateFilters]);
  
  const handleRegionChange = useCallback((region: PropertyFilters["region"]) => {
    updateFilters({ region });
    setCurrentPageState(1);
  }, [updateFilters]);
  
  const handleRoomsChange = useCallback((rooms: number | null) => {
    updateFilters({ roomsMin: rooms });
    setCurrentPageState(1);
  }, [updateFilters]);
  
  const handleSortChange = useCallback((sortBy: PropertyFilters["sortBy"]) => {
    // Сортировка не сбрасывает страницу
    updateFilters({ sortBy });
  }, [updateFilters]);
  
  const handleAreaMinChange = useCallback((areaMin: number | null) => {
    // Для обратной совместимости - если передали число напрямую, применяем сразу
    updateFilters({ areaMin });
  }, [updateFilters]);
  
  const handleAreaMinBlur = useCallback(() => {
    if (areaMinDebounceRef.current) {
      clearTimeout(areaMinDebounceRef.current);
      areaMinDebounceRef.current = null;
    }
    applyDraftAreaMin(draftAreaMin);
  }, [draftAreaMin, applyDraftAreaMin]);
  
  // Обработчики для цен (с валидацией)
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
  
  // Сбросы
  const handleTypeReset = useCallback(() => {
    updateFilters({ type: "all" });
    setCurrentPageState(1);
  }, [updateFilters]);
  
  const handlePriceReset = useCallback(() => {
    updateFilters({ priceMin: null, priceMax: null });
    setDraftPriceMinState("");
    setDraftPriceMaxState("");
    setPriceErrors({});
    setCurrentPageState(1);
  }, [updateFilters]);
  
  const handleRegionReset = useCallback(() => {
    updateFilters({ region: "all" });
    setCurrentPageState(1);
  }, [updateFilters]);
  
  const handleRoomsReset = useCallback(() => {
    updateFilters({ roomsMin: null });
    setCurrentPageState(1);
  }, [updateFilters]);
  
  const handleAreaReset = useCallback(() => {
    updateFilters({ areaMin: null });
    setDraftAreaMinState("");
  }, [updateFilters]);
  
  const handleResetAll = useCallback(() => {
    resetFilters();
    setDraftQueryState("");
    setDraftPriceMinState("");
    setDraftPriceMaxState("");
    setDraftAreaMinState("");
    setPriceErrors({});
    setCurrentPageState(1);
  }, [resetFilters]);
  
  // Setter для страницы
  const setCurrentPage = useCallback((page: number) => {
    if (typeof page === "number" && page > 0 && page !== currentPage) {
      setCurrentPageState(page);
    }
  }, [currentPage]);
  
  // Обертки для setters с установкой флага isUserTypingRef
  const setDraftPriceMin = useCallback((value: string) => {
    // Очищаем предыдущий таймер, если он есть
    if (priceMinTypingTimeoutRef.current) {
      clearTimeout(priceMinTypingTimeoutRef.current);
    }
    
    isUserTypingRef.current = true;
    setDraftPriceMinState(value);
    
    // Сбрасываем флаг после небольшой задержки, чтобы debounce успел сработать
    priceMinTypingTimeoutRef.current = setTimeout(() => {
      isUserTypingRef.current = false;
      priceMinTypingTimeoutRef.current = null;
    }, SEARCH_CONSTANTS.DEBOUNCE_DELAY + 100);
  }, []);
  
  const setDraftPriceMax = useCallback((value: string) => {
    // Очищаем предыдущий таймер, если он есть
    if (priceMaxTypingTimeoutRef.current) {
      clearTimeout(priceMaxTypingTimeoutRef.current);
    }
    
    isUserTypingRef.current = true;
    setDraftPriceMaxState(value);
    
    // Сбрасываем флаг после небольшой задержки, чтобы debounce успел сработать
    priceMaxTypingTimeoutRef.current = setTimeout(() => {
      isUserTypingRef.current = false;
      priceMaxTypingTimeoutRef.current = null;
    }, SEARCH_CONSTANTS.DEBOUNCE_DELAY + 100);
  }, []);
  
  return {
    appliedFilters,
    draftQuery,
    draftPriceMin,
    draftPriceMax,
    draftAreaMin,
    setDraftQuery: setDraftQueryState,
    setDraftPriceMin,
    setDraftPriceMax,
    setDraftAreaMin: setDraftAreaMinState,
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
  };
}
