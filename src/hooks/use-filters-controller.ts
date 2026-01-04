import { useState, useCallback, useRef, useEffect } from "react";
import type { PropertyFilters } from "@/stores";
import { SEARCH_CONSTANTS } from "@/lib/search-constants";

interface UseFiltersControllerOptions {
  filters: PropertyFilters;
  updateFilters: (filters: Partial<PropertyFilters>) => void;
  resetFilters: () => void;
  onPageReset?: () => void;
  // Опциональные внешние состояния для цен (если используются из другого hook)
  externalLocalPriceMin?: string;
  externalLocalPriceMax?: string;
  externalSetLocalPriceMin?: (value: string) => void;
  externalSetLocalPriceMax?: (value: string) => void;
}

interface UseFiltersControllerReturn {
  // Локальные состояния для цен (для debounce)
  localPriceMin: string;
  localPriceMax: string;
  setLocalPriceMin: (value: string) => void;
  setLocalPriceMax: (value: string) => void;

  // Обработчики для фильтров
  handleTypeChange: (type: PropertyFilters["type"]) => void;
  handleRegionChange: (region: PropertyFilters["region"]) => void;
  handleRoomsChange: (rooms: number | null) => void;
  handleSortChange: (sortBy: PropertyFilters["sortBy"]) => void;
  handleAreaMinChange: (areaMin: number | null) => void;

  // Обработчики для цен (с debounce)
  handlePriceMinBlur: () => void;
  handlePriceMaxBlur: () => void;

  // Сбросы
  handleTypeReset: () => void;
  handlePriceReset: () => void;
  handleRegionReset: () => void;
  handleRoomsReset: () => void;
  handleAreaReset: () => void;
  handleResetAll: () => void;
}

/**
 * Единый hook для управления фильтрами с debounce для цен
 * Используется в MobileFilterDrawer и других компонентах фильтров
 */
export function useFiltersController({
  filters,
  updateFilters,
  resetFilters,
  onPageReset,
  externalLocalPriceMin,
  externalLocalPriceMax,
  externalSetLocalPriceMin,
  externalSetLocalPriceMax,
}: UseFiltersControllerOptions): UseFiltersControllerReturn {
  // Используем внешние состояния, если они переданы, иначе создаем внутренние
  const [internalLocalPriceMin, setInternalLocalPriceMin] = useState(() =>
    filters.priceMin != null ? String(filters.priceMin) : ""
  );
  const [internalLocalPriceMax, setInternalLocalPriceMax] = useState(() =>
    filters.priceMax != null ? String(filters.priceMax) : ""
  );

  const localPriceMin = externalLocalPriceMin ?? internalLocalPriceMin;
  const localPriceMax = externalLocalPriceMax ?? internalLocalPriceMax;
  const setLocalPriceMin =
    externalSetLocalPriceMin ?? setInternalLocalPriceMin;
  const setLocalPriceMax =
    externalSetLocalPriceMax ?? setInternalLocalPriceMax;

  // Refs для debounce
  const priceMinDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceMaxDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Синхронизация локальных состояний с filters при изменении извне
  useEffect(() => {
    const newPriceMin = filters.priceMin != null ? String(filters.priceMin) : "";
    const newPriceMax = filters.priceMax != null ? String(filters.priceMax) : "";

    if (localPriceMin !== newPriceMin) {
      setLocalPriceMin(newPriceMin);
    }
    if (localPriceMax !== newPriceMax) {
      setLocalPriceMax(newPriceMax);
    }
  }, [filters.priceMin, filters.priceMax, localPriceMin, localPriceMax]);

  // Универсальный обработчик изменения фильтров
  const handleSetFilters = useCallback(
    (newFilters: Partial<PropertyFilters>, resetPage = true) => {
      updateFilters(newFilters);
      if (resetPage && onPageReset) {
        onPageReset();
      }
    },
    [updateFilters, onPageReset]
  );

  // Обработчики для конкретных фильтров
  const handleTypeChange = useCallback(
    (type: PropertyFilters["type"]) => {
      handleSetFilters({ type });
    },
    [handleSetFilters]
  );

  const handleRegionChange = useCallback(
    (region: PropertyFilters["region"]) => {
      handleSetFilters({ region });
    },
    [handleSetFilters]
  );

  const handleRoomsChange = useCallback(
    (rooms: number | null) => {
      handleSetFilters({ roomsMin: rooms });
    },
    [handleSetFilters]
  );

  const handleSortChange = useCallback(
    (sortBy: PropertyFilters["sortBy"]) => {
      // Сортировка не сбрасывает страницу
      handleSetFilters({ sortBy }, false);
    },
    [handleSetFilters]
  );

  const handleAreaMinChange = useCallback(
    (areaMin: number | null) => {
      // Площадь не сбрасывает страницу
      handleSetFilters({ areaMin }, false);
    },
    [handleSetFilters]
  );

  // Debounced обработчики для цен
  const handlePriceMinBlur = useCallback(() => {
    if (priceMinDebounceRef.current) {
      clearTimeout(priceMinDebounceRef.current);
      priceMinDebounceRef.current = null;
    }

    const value = localPriceMin.trim();
    if (!value || isNaN(Number(value))) {
      updateFilters({ priceMin: null });
    } else {
      const numValue = Number(value);
      if (numValue >= 0) {
        updateFilters({ priceMin: numValue });
        if (onPageReset) onPageReset();
      } else {
        updateFilters({ priceMin: null });
      }
    }
  }, [localPriceMin, updateFilters, onPageReset]);

  const handlePriceMaxBlur = useCallback(() => {
    if (priceMaxDebounceRef.current) {
      clearTimeout(priceMaxDebounceRef.current);
      priceMaxDebounceRef.current = null;
    }

    const value = localPriceMax.trim();
    if (!value || isNaN(Number(value))) {
      updateFilters({ priceMax: null });
    } else {
      const numValue = Number(value);
      if (numValue >= 0) {
        updateFilters({ priceMax: numValue });
        if (onPageReset) onPageReset();
      } else {
        updateFilters({ priceMax: null });
      }
    }
  }, [localPriceMax, updateFilters, onPageReset]);

  // Debounce для цен при вводе (опционально, можно использовать вместо onBlur)
  useEffect(() => {
    if (priceMinDebounceRef.current) {
      clearTimeout(priceMinDebounceRef.current);
    }

    // Если поле пустое, не делаем debounce
    if (localPriceMin === "") {
      return;
    }

    priceMinDebounceRef.current = setTimeout(() => {
      const value = localPriceMin.trim();
      if (value && !isNaN(Number(value))) {
        const numValue = Number(value);
        if (numValue >= 0) {
          updateFilters({ priceMin: numValue });
          if (onPageReset) onPageReset();
        }
      }
    }, SEARCH_CONSTANTS.DEBOUNCE_DELAY);

    return () => {
      if (priceMinDebounceRef.current) {
        clearTimeout(priceMinDebounceRef.current);
      }
    };
  }, [localPriceMin, updateFilters, onPageReset]);

  useEffect(() => {
    if (priceMaxDebounceRef.current) {
      clearTimeout(priceMaxDebounceRef.current);
    }

    // Если поле пустое, не делаем debounce
    if (localPriceMax === "") {
      return;
    }

    priceMaxDebounceRef.current = setTimeout(() => {
      const value = localPriceMax.trim();
      if (value && !isNaN(Number(value))) {
        const numValue = Number(value);
        if (numValue >= 0) {
          updateFilters({ priceMax: numValue });
          if (onPageReset) onPageReset();
        }
      }
    }, SEARCH_CONSTANTS.DEBOUNCE_DELAY);

    return () => {
      if (priceMaxDebounceRef.current) {
        clearTimeout(priceMaxDebounceRef.current);
      }
    };
  }, [localPriceMax, updateFilters, onPageReset]);

  // Обработчики сброса
  const handleTypeReset = useCallback(() => {
    handleSetFilters({ type: "all" });
  }, [handleSetFilters]);

  const handlePriceReset = useCallback(() => {
    updateFilters({ priceMin: null, priceMax: null });
    setLocalPriceMin("");
    setLocalPriceMax("");
    if (onPageReset) onPageReset();
  }, [updateFilters, onPageReset]);

  const handleRegionReset = useCallback(() => {
    handleSetFilters({ region: "all" });
  }, [handleSetFilters]);

  const handleRoomsReset = useCallback(() => {
    handleSetFilters({ roomsMin: null });
  }, [handleSetFilters]);

  const handleAreaReset = useCallback(() => {
    updateFilters({ areaMin: null });
  }, [updateFilters]);

  const handleResetAll = useCallback(() => {
    resetFilters();
    setLocalPriceMin("");
    setLocalPriceMax("");
    if (onPageReset) onPageReset();
  }, [resetFilters, onPageReset]);

  return {
    localPriceMin,
    localPriceMax,
    setLocalPriceMin,
    setLocalPriceMax,
    handleTypeChange,
    handleRegionChange,
    handleRoomsChange,
    handleSortChange,
    handleAreaMinChange,
    handlePriceMinBlur,
    handlePriceMaxBlur,
    handleTypeReset,
    handlePriceReset,
    handleRegionReset,
    handleRoomsReset,
    handleAreaReset,
    handleResetAll,
  };
}

