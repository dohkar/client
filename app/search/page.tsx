"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePropertyStore } from "@/stores";
import { useProperties } from "@/hooks/use-properties";
import { useSearchSync } from "@/hooks/use-search-sync";
import { useFiltersController } from "@/hooks/use-filters-controller";
import { buildApiSearchParams, getPageFromSearchParams } from "@/lib/search-utils";
import { SEARCH_CONSTANTS, PROPERTY_TYPE_LABELS } from "@/lib/search-constants";
import { Spinner } from "@/components/ui";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  HorizontalFilters,
  ActiveFilters,
  SearchResults,
} from "@/components/search";
import { ROUTES } from "@/constants";

// Основной компонент страницы поиска
function SearchPageContent() {
  const { filters, updateFilters, resetFilters } = usePropertyStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  // useState для page: нет race conditions, так как не зависит от асинхронщины
  const [currentPage, setCurrentPage] = useState(() =>
    getPageFromSearchParams(searchParams)
  );

  // Синхронизация local state <-> store/URL
  const { localPriceMin, setLocalPriceMin, localPriceMax, setLocalPriceMax } =
    useSearchSync({
      filters,
      updateFilters,
      resetFilters,
      currentPage,
      setCurrentPage,
    });

  // Единый hook для управления фильтрами
  // Используем localPriceMin/localPriceMax из useSearchSync для синхронизации с URL
  const filtersController = useFiltersController({
    filters,
    updateFilters,
    resetFilters,
    onPageReset: () => setCurrentPage(1),
    externalLocalPriceMin: localPriceMin,
    externalLocalPriceMax: localPriceMax,
    externalSetLocalPriceMin: setLocalPriceMin,
    externalSetLocalPriceMax: setLocalPriceMax,
  });

  // Корректно мемоизированные параметры для запроса (filters, currentPage)
  const urlSearchParams = useMemo(
    () => buildApiSearchParams(filters, currentPage, SEARCH_CONSTANTS.ITEMS_PER_PAGE),
    [filters, currentPage]
  );

  // Хук получения данных: обрабатывает undefined/null данных и ошибки
  const { data, isLoading, error } = useProperties(urlSearchParams);
  const properties = Array.isArray(data?.data) ? data.data : [];
  const totalPages = typeof data?.totalPages === "number" ? data.totalPages : 0;

  // Вычисляет число активных фильтров — сверяет на null/undefined для числовых и "all" для строковых
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.type && filters.type !== "all") count++;
    if (filters.priceMin != null) count++;
    if (filters.priceMax != null) count++;
    if (filters.roomsMin != null) count++;
    if (filters.areaMin != null) count++;
    if (filters.region && filters.region !== "all") count++;
    return count;
  }, [filters]);

  // Используем обработчики из filtersController, но переопределяем для синхронизации с useSearchSync
  const handlePriceMinBlur = () => {
    filtersController.handlePriceMinBlur();
  };

  const handlePriceMaxBlur = () => {
    filtersController.handlePriceMaxBlur();
  };

  // Обёртки для синхронизации с useSearchSync
  const handleTypeChange = filtersController.handleTypeChange;
  const handleRegionChange = filtersController.handleRegionChange;
  const handleRoomsChange = filtersController.handleRoomsChange;
  const handleSortChange = filtersController.handleSortChange;
  const handleAreaMinChange = filtersController.handleAreaMinChange;

  // Сбросы для отдельных фильтров
  const handleTypeReset = filtersController.handleTypeReset;
  const handlePriceReset = () => {
    filtersController.handlePriceReset();
    setLocalPriceMin("");
    setLocalPriceMax("");
  };
  const handleRegionReset = filtersController.handleRegionReset;
  const handleRoomsReset = filtersController.handleRoomsReset;
  const handleAreaReset = filtersController.handleAreaReset;

  // Полный сброс фильтров и локальных значений
  const handleResetAll = () => {
    filtersController.handleResetAll();
    setLocalPriceMin("");
    setLocalPriceMax("");
  };

  // Быстрые пресеты: выставляют фильтры + локальные значения для цен, если есть
  const handlePresetSelect = (
    presetFilters: Parameters<typeof updateFilters>[0],
    localPriceMinValue?: string,
    localPriceMaxValue?: string
  ) => {
    updateFilters(presetFilters);
    setCurrentPage(1);
    if (typeof localPriceMinValue === "string") setLocalPriceMin(localPriceMinValue);
    if (typeof localPriceMaxValue === "string") setLocalPriceMax(localPriceMaxValue);
  };

  // Страницы
  const handlePageChange = (page: number) => {
    if (typeof page === "number" && page > 0 && page !== currentPage)
      setCurrentPage(page);
  };

  // Reset кнопки в результатах
  const handleResetFilters = () => handleResetAll();

  // Навигация: если ROUTES.home не определён, будет баг (но обычно определён)
  const handleGoHome = () => {
    if (ROUTES.home) router.push(ROUTES.home);
  };

  return (
    <div className='min-h-screen flex flex-col bg-background'>
      <main className='flex-1 px-4 py-8 max-w-7xl mx-auto w-full'>
        {/* Breadcrumbs */}
        <Breadcrumb className='mb-4'>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={ROUTES.home}>Главная</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Поиск</BreadcrumbPage>
            </BreadcrumbItem>
            {filters.type !== "all" && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {PROPERTY_TYPE_LABELS[filters.type] || "Тип недвижимости"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Горизонтальные фильтры */}
        <HorizontalFilters
          filters={filters}
          localPriceMin={localPriceMin}
          localPriceMax={localPriceMax}
          onTypeChange={handleTypeChange}
          onRegionChange={handleRegionChange}
          onRoomsChange={handleRoomsChange}
          onSortChange={handleSortChange}
          onPriceMinChange={setLocalPriceMin}
          onPriceMaxChange={setLocalPriceMax}
          onPriceMinBlur={handlePriceMinBlur}
          onPriceMaxBlur={handlePriceMaxBlur}
          onAreaMinChange={handleAreaMinChange}
        />

        {/* Активные фильтры */}
        <ActiveFilters
          filters={filters}
          activeFiltersCount={activeFiltersCount}
          localPriceMin={localPriceMin}
          localPriceMax={localPriceMax}
          onTypeReset={handleTypeReset}
          onPriceReset={handlePriceReset}
          onRegionReset={handleRegionReset}
          onRoomsReset={handleRoomsReset}
          onAreaReset={handleAreaReset}
          onResetAll={handleResetAll}
        />

        {/* Результаты поиска */}
        <div>
          <div className='mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <h1 className='text-xl sm:text-2xl font-bold text-foreground'>
              Результаты поиска: {typeof data?.total === "number" ? data.total : 0}{" "}
              объявлений
            </h1>
          </div>

          {/* Быстрые пресеты */}
          {/* <QuickPresets onPresetSelect={handlePresetSelect} /> */}

          <SearchResults
            properties={properties}
            isLoading={isLoading}
            error={error}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onResetFilters={handleResetFilters}
            onGoHome={handleGoHome}
          />
        </div>
      </main>
    </div>
  );
}

// Suspense-обёртка, подстраховано наличие Spinner на загрузку
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex justify-center items-center'>
          <div className='animate-pulse text-muted-foreground text-lg'>
            <Spinner />
          </div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
