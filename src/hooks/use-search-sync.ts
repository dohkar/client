import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import type { PropertyFilters } from "@/stores";
import {
  areFiltersEqual,
  getFiltersFromSearchParams,
  getPageFromSearchParams,
  searchParamsToFilters,
  buildSearchUrl,
} from "@/lib/search-utils";
import { SEARCH_CONSTANTS } from "@/lib/search-constants";

interface UseSearchSyncOptions {
  filters: PropertyFilters;
  updateFilters: (filters: Partial<PropertyFilters>) => void;
  resetFilters: () => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

interface UseSearchSyncReturn {
  searchText: string;
  setSearchText: (text: string) => void;
  localPriceMin: string;
  setLocalPriceMin: (price: string) => void;
  localPriceMax: string;
  setLocalPriceMax: (price: string) => void;
}

/**
 * Хук для синхронизации состояния поиска между URL, store и локальными состояниями
 * БЕЗ циклов и двойных обновлений
 */
export function useSearchSync({
  filters,
  updateFilters,
  resetFilters,
  currentPage,
  setCurrentPage,
}: UseSearchSyncOptions): UseSearchSyncReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Рефы для отслеживания источника изменений
  const isInitializedRef = useRef(false);
  const isUpdatingFromUrlRef = useRef(false);
  const isUpdatingToUrlRef = useRef(false);
  const lastUrlRef = useRef<string>("");
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Локальные состояния для UI
  const [searchText, setSearchText] = useState(() => {
    const urlQuery = searchParams?.get("query");
    return urlQuery || filters.query || "";
  });

  const [localPriceMin, setLocalPriceMin] = useState(() => {
    const urlValue = searchParams?.get("priceMin");
    if (urlValue !== null && urlValue !== "" && !isNaN(Number(urlValue))) {
      return urlValue;
    }
    // Правильно обрабатываем 0
    return filters.priceMin != null ? String(filters.priceMin) : "";
  });

  const [localPriceMax, setLocalPriceMax] = useState(() => {
    const urlValue = searchParams?.get("priceMax");
    if (urlValue !== null && urlValue !== "" && !isNaN(Number(urlValue))) {
      return urlValue;
    }
    // Правильно обрабатываем 0
    return filters.priceMax != null ? String(filters.priceMax) : "";
  });

  // 🔹 ИНИЦИАЛИЗАЦИЯ: Один раз при монтировании — читаем URL и инициализируем store
  useEffect(() => {
    if (isInitializedRef.current) return;

    // Если searchParams есть, читаем из URL
    if (searchParams && searchParams.toString().length > 0) {
      isUpdatingFromUrlRef.current = true;
      const urlFilters = getFiltersFromSearchParams(searchParams);
      const urlPage = getPageFromSearchParams(searchParams);

      // Применяем фильтры из URL
      const filtersToUpdate = searchParamsToFilters(urlFilters);
      updateFilters(filtersToUpdate);
      setSearchText(filtersToUpdate.query || "");
      setLocalPriceMin(
        filtersToUpdate.priceMin != null ? String(filtersToUpdate.priceMin) : ""
      );
      setLocalPriceMax(
        filtersToUpdate.priceMax != null ? String(filtersToUpdate.priceMax) : ""
      );
      setCurrentPage(urlPage);

      // Сохраняем текущий URL для сравнения
      lastUrlRef.current = buildSearchUrl(
        { ...filters, ...filtersToUpdate } as PropertyFilters,
        urlPage,
        pathname
      );
    } else {
      // Если URL пустой, синхронизируем локальные состояния с текущими фильтрами
      setSearchText(filters.query || "");
      setLocalPriceMin(filters.priceMin != null ? String(filters.priceMin) : "");
      setLocalPriceMax(filters.priceMax != null ? String(filters.priceMax) : "");
      lastUrlRef.current = pathname;
    }

    isInitializedRef.current = true;
    isUpdatingFromUrlRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Только при монтировании

  // 🔹 СИНХРОНИЗАЦИЯ URL → Store (только при изменении URL через браузер: Назад/Вперёд)
  useEffect(() => {
    if (!isInitializedRef.current || isUpdatingToUrlRef.current) {
      return;
    }

    // Стабильная строка для сравнения
    const urlFromParams =
      pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    // Если URL изменился извне (браузерная навигация) и отличается от lastUrl
    if (urlFromParams !== lastUrlRef.current) {
      const currentUrl = buildSearchUrl(filters, currentPage, pathname);

      // Только если URL не совпадает с тем, что мы ожидаем
      if (urlFromParams !== currentUrl) {
        isUpdatingFromUrlRef.current = true;

        const urlFilters = getFiltersFromSearchParams(searchParams);
        const urlPage = getPageFromSearchParams(searchParams);

        // Проверяем, действительно ли фильтры отличаются
        if (!areFiltersEqual(filters, urlFilters) || currentPage !== urlPage) {
          const filtersToUpdate = searchParamsToFilters(urlFilters);
          updateFilters(filtersToUpdate);
          setSearchText(filtersToUpdate.query || "");
          setLocalPriceMin(
            filtersToUpdate.priceMin != null ? String(filtersToUpdate.priceMin) : ""
          );
          setLocalPriceMax(
            filtersToUpdate.priceMax != null ? String(filtersToUpdate.priceMax) : ""
          );
          setCurrentPage(urlPage);
        }

        lastUrlRef.current = urlFromParams;

        // Используем микротаск для сброса флага
        Promise.resolve().then(() => {
          isUpdatingFromUrlRef.current = false;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, pathname]); // Реагируем только на изменения searchParams

  // 🔹 СИНХРОНИЗАЦИЯ Store → URL (при изменении фильтров или страницы)
  useEffect(() => {
    if (!isInitializedRef.current || isUpdatingFromUrlRef.current) {
      return;
    }

    const newUrl = buildSearchUrl(filters, currentPage, pathname);
    const currentUrl =
      pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    // Обновляем URL только если он действительно отличается
    if (newUrl !== currentUrl && newUrl !== lastUrlRef.current) {
      isUpdatingToUrlRef.current = true;
      lastUrlRef.current = newUrl;

      router.replace(newUrl, { scroll: false });

      // Сбрасываем флаг синхронно после обновления
      // Используем requestAnimationFrame для гарантии, что обновление произошло
      requestAnimationFrame(() => {
        isUpdatingToUrlRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, currentPage, pathname, router]); // БЕЗ searchParams в зависимостях!

  // 🔹 СИНХРОНИЗАЦИЯ searchText с filters.query (только при изменении извне, не от debounce)
  useEffect(() => {
    // Не синхронизируем во время обновления из URL или при debounce
    if (isUpdatingFromUrlRef.current || debounceTimeoutRef.current) {
      return;
    }

    // Синхронизируем только если query изменился извне (не от нашего debounce)
    const trimmedQuery = filters.query?.trim() || "";
    const currentSearchText = searchText.trim();

    if (currentSearchText !== trimmedQuery) {
      setSearchText(trimmedQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.query]);

  // 🔹 СИНХРОНИЗАЦИЯ localPriceMin/Max с filters.priceMin/Max (только при изменении извне)
  useEffect(() => {
    // Не синхронизируем во время обновления из URL
    if (isUpdatingFromUrlRef.current) {
      return;
    }

    // Правильно обрабатываем 0
    const newPriceMin = filters.priceMin != null ? String(filters.priceMin) : "";
    const newPriceMax = filters.priceMax != null ? String(filters.priceMax) : "";

    if (localPriceMin !== newPriceMin) {
      setLocalPriceMin(newPriceMin);
    }
    if (localPriceMax !== newPriceMax) {
      setLocalPriceMax(newPriceMax);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.priceMin, filters.priceMax]);

  // 🔹 Debounce для поискового запроса (БЕЗ двойных обновлений)
  useEffect(() => {
    const trimmedQuery = searchText.trim();

    // Если текст совпадает с текущим фильтром, ничего не делаем
    if (filters.query === trimmedQuery) {
      return;
    }

    // Очищаем предыдущий timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Устанавливаем новый timeout
    debounceTimeoutRef.current = setTimeout(() => {
      // Обновляем фильтры только если query действительно изменился
      if (filters.query !== trimmedQuery) {
        updateFilters({ query: trimmedQuery });
        setCurrentPage(1);
      }
    }, SEARCH_CONSTANTS.DEBOUNCE_DELAY);

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText]); // Только searchText в зависимостях

  return {
    searchText,
    setSearchText,
    localPriceMin,
    setLocalPriceMin,
    localPriceMax,
    setLocalPriceMax,
  };
}
