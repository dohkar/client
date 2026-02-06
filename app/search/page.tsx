"use client";

import { useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useProperties } from "@/hooks/use-properties";
import { useSearchFilters } from "@/hooks/use-search-filters";
import { useCities } from "@/hooks/use-cities";
import { toPropertySearchParams } from "@/lib/search-params";
import { getRegionIdByName } from "@/services/region.service";
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
import { HorizontalFilters, ActiveFilters, SearchResults } from "@/components/search";
import { ROUTES } from "@/constants";
import Link from "next/link";

// Основной компонент страницы поиска
function SearchPageContent() {
  const router = useRouter();

  // URL — единственный источник истины для фильтров
  const {
    appliedFilters,
    draftPriceMin,
    draftPriceMax,
    draftAreaMin,
    setDraftPriceMin,
    setDraftPriceMax,
    setDraftAreaMin,
    handleTypeChange,
    handleRegionChange,
    handleRoomsChange,
    handleSortChange,
    handleAreaMinBlur,
    handlePriceMinBlur,
    handlePriceMaxBlur,
    handleCityChange,
    handleCityReset,
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
  } = useSearchFilters();

  const regionId =
    appliedFilters.region !== "all"
      ? getRegionIdByName(appliedFilters.region)
      : undefined;
  const { data: cities = [] } = useCities(regionId ?? undefined);
  const selectedCityName =
    appliedFilters.cityId != null
      ? (cities.find((c) => c.id === appliedFilters.cityId)?.name ?? null)
      : null;

  // Параметры для API из URL (appliedFilters уже содержат page/limit)
  const apiParams = useMemo(
    () => toPropertySearchParams(appliedFilters, SEARCH_CONSTANTS.ITEMS_PER_PAGE),
    [appliedFilters]
  );

  // Хук получения данных: обрабатывает undefined/null данных и ошибки
  const { data, isLoading, error } = useProperties(apiParams);
  const properties = Array.isArray(data?.data) ? data.data : [];
  const totalPages = typeof data?.totalPages === "number" ? data.totalPages : 0;

  // Вычисляет число активных фильтров — сверяет на null/undefined для числовых и "all" для строковых
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.query && appliedFilters.query.trim().length > 0) count++;
    if (appliedFilters.type && appliedFilters.type !== "all") count++;
    if (appliedFilters.priceMin != null) count++;
    if (appliedFilters.priceMax != null) count++;
    if (appliedFilters.roomsMin != null) count++;
    if (appliedFilters.areaMin != null) count++;
    if (appliedFilters.region && appliedFilters.region !== "all") count++;
    if (appliedFilters.cityId && appliedFilters.cityId.trim().length > 0) count++;
    return count;
  }, [appliedFilters]);

  // Страницы
  const handlePageChange = (page: number) => {
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
              <BreadcrumbLink asChild>
                <Link href={ROUTES.home}>Главная</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Поиск</BreadcrumbPage>
            </BreadcrumbItem>
            {appliedFilters.type !== "all" && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {PROPERTY_TYPE_LABELS[appliedFilters.type] || "Тип недвижимости"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        {/* Горизонтальные фильтры */}
        <HorizontalFilters
          filters={appliedFilters}
          cities={cities}
          localPriceMin={draftPriceMin}
          localPriceMax={draftPriceMax}
          localAreaMin={draftAreaMin}
          priceErrors={priceErrors}
          onTypeChange={handleTypeChange}
          onRegionChange={handleRegionChange}
          onCityChange={handleCityChange}
          onRoomsChange={handleRoomsChange}
          onSortChange={handleSortChange}
          onPriceMinChange={setDraftPriceMin}
          onPriceMaxChange={setDraftPriceMax}
          onPriceMinBlur={handlePriceMinBlur}
          onPriceMaxBlur={handlePriceMaxBlur}
          onAreaMinChange={setDraftAreaMin}
          onAreaMinBlur={handleAreaMinBlur}
        />

        {/* Активные фильтры */}
        <ActiveFilters
          filters={appliedFilters}
          activeFiltersCount={activeFiltersCount}
          selectedCityName={selectedCityName}
          localPriceMin={draftPriceMin}
          localPriceMax={draftPriceMax}
          onTypeReset={handleTypeReset}
          onPriceReset={handlePriceReset}
          onRegionReset={handleRegionReset}
          onCityReset={handleCityReset}
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
            isLoading={isLoading || isPending}
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
