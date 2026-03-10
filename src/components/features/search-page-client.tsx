"use client";

import { useMemo, useEffect, useRef, useReducer, useCallback, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Search, XIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useProperties } from "@/hooks/use-properties";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useCities } from "@/hooks/use-cities";
import { useSegmentSearchFilters } from "@/hooks/use-segment-search-filters";
import { toPropertySearchParams, type SearchFiltersDisplay } from "@/lib/search-params";
import {
  getRegionIdByName,
  ensureRegionCacheInitialized,
} from "@/services/region.service";
import {
  SEARCH_CONSTANTS,
  PROPERTY_TYPE_LABELS,
  REGION_OPTIONS,
} from "@/lib/search-constants";
import { useSortedRegionOptions } from "@/hooks/use-user-region";
import type { RegionOption } from "@/hooks/use-user-region";
import { ROUTES } from "@/constants";
import { Input } from "@/components/ui/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  ActiveFilters,
  HorizontalFilters,
  QuickPresets,
  SearchResults,
} from "@/components/search";
import { MobileFilterDrawer } from "@/components/features/MobileFilterDrawer";

export interface SegmentRouteParams {
  region: string;
  category: string;
  dealType?: string;
}

interface SearchPageClientProps {
  params: SegmentRouteParams;
  searchParams?: Record<string, string | string[] | undefined>;
}

export function SearchPageClient({
  params: paramsProp,
  searchParams: searchParamsProp,
}: SearchPageClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathParams = useParams();

  // Параметры маршрута всегда из URL (useParams), чтобы при клиентской навигации
  // не показывать старые данные из кэша/пропсов
  const params = useMemo<SegmentRouteParams>(
    () => ({
      region:
        typeof pathParams.region === "string" ? pathParams.region : paramsProp.region,
      category:
        typeof pathParams.category === "string"
          ? pathParams.category
          : paramsProp.category,
      dealType:
        typeof pathParams.dealType === "string" && pathParams.dealType
          ? pathParams.dealType
          : undefined,
    }),
    [
      pathParams.region,
      pathParams.category,
      pathParams.dealType,
      paramsProp.region,
      paramsProp.category,
    ]
  );

  const searchParams = searchParamsProp;
  const regionOptions = useSortedRegionOptions(
    REGION_OPTIONS as unknown as RegionOption[]
  );

  const {
    appliedFilters,
    showRegionChip,
    draftQuery,
    setDraftQuery,
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
    handleAreaMinChange,
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
    handleQueryReset,
    handleDealTypeChange,
    handleDealTypeReset,
    handleFloorReset,
    handleResetAll,
    priceErrors,
    setCurrentPage,
    isPending,
    updateFilters,
  } = useSegmentSearchFilters(params, searchParams);

  // Оптимистичные фильтры: при клике по пресету URL обновляется асинхронно,
  // поэтому сразу подставляем объединённые фильтры для запроса, чтобы сработало с первого клика.
  const [optimisticFilters, setOptimisticFilters] = useState<SearchFiltersDisplay | null>(
    null
  );

  const handlePresetSelect = useCallback(
    (
      filters: Parameters<typeof updateFilters>[0],
      localPriceMin?: string,
      localPriceMax?: string
    ) => {
      const merged: SearchFiltersDisplay = {
        ...appliedFilters,
        ...filters,
        page: 1,
      };
      setOptimisticFilters(merged);
      updateFilters({ ...filters }, { resetPage: true });
      setDraftPriceMin(localPriceMin ?? "");
      setDraftPriceMax(localPriceMax ?? "");
    },
    [appliedFilters, updateFilters, setDraftPriceMin, setDraftPriceMax]
  );

  // Сбрасываем оптимистичные фильтры, когда URL догнал (appliedFilters совпал с тем, что мы выставили).
  useEffect(() => {
    if (optimisticFilters == null) return;
    const keyFields: (keyof SearchFiltersDisplay)[] = [
      "type",
      "priceMin",
      "priceMax",
      "roomsMin",
      "region",
      "areaMin",
      "page",
    ];
    const caughtUp = keyFields.every((k) => {
      const a = appliedFilters[k];
      const o = optimisticFilters[k];
      return a === o || (a == null && o == null);
    });
    if (caughtUp) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Очистка optimistic при синхронизации с URL; один лишний рендер допустим.
      setOptimisticFilters(null);
    }
  }, [appliedFilters, optimisticFilters]);

  const effectiveFilters = optimisticFilters ?? appliedFilters;

  // Пока пресет только применился, показываем цены из пресета (иначе эффекты хука перезапишут draft из старого URL).
  const displayPriceMin =
    optimisticFilters != null
      ? optimisticFilters.priceMin != null
        ? String(optimisticFilters.priceMin)
        : ""
      : draftPriceMin;
  const displayPriceMax =
    optimisticFilters != null
      ? optimisticFilters.priceMax != null
        ? String(optimisticFilters.priceMax)
        : ""
      : draftPriceMax;

  const handlePriceMinChange = useCallback(
    (v: string) => {
      setOptimisticFilters(null);
      setDraftPriceMin(v);
    },
    [setDraftPriceMin]
  );
  const handlePriceMaxChange = useCallback(
    (v: string) => {
      setOptimisticFilters(null);
      setDraftPriceMax(v);
    },
    [setDraftPriceMax]
  );

  const regionCacheInitRef = useRef(false);
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    if (regionCacheInitRef.current) return;
    regionCacheInitRef.current = true;

    ensureRegionCacheInitialized()
      .then(() => {
        forceRender();
        queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
      })
      .catch(() => {});
  }, [queryClient]);

  const regionId =
    effectiveFilters.region !== "all"
      ? getRegionIdByName(effectiveFilters.region)
      : undefined;

  const { data: cities = [] } = useCities(regionId ?? undefined);
  const selectedCityName =
    effectiveFilters.cityId != null
      ? (cities.find((city) => city.id === effectiveFilters.cityId)?.name ?? null)
      : null;

  const apiParams = useMemo(
    () => toPropertySearchParams(effectiveFilters, SEARCH_CONSTANTS.ITEMS_PER_PAGE),
    [effectiveFilters]
  );
  const { data, isLoading, error } = useProperties(apiParams);

  const properties = Array.isArray(data?.data) ? data.data : [];
  const totalPages = typeof data?.totalPages === "number" ? data.totalPages : 0;

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (effectiveFilters.query && effectiveFilters.query.trim().length > 0) count++;
    if (effectiveFilters.dealType && effectiveFilters.dealType !== "all") count++;
    if (effectiveFilters.type && effectiveFilters.type !== "all") count++;
    if (effectiveFilters.priceMin != null) count++;
    if (effectiveFilters.priceMax != null) count++;
    if (effectiveFilters.roomsMin != null) count++;
    if (effectiveFilters.areaMin != null) count++;
    if (
      effectiveFilters.floorMin != null ||
      effectiveFilters.floorMax != null ||
      effectiveFilters.floorNotFirst === true
    )
      count++;
    if (showRegionChip && effectiveFilters.region && effectiveFilters.region !== "all")
      count++;
    if (effectiveFilters.cityId && effectiveFilters.cityId.trim().length > 0) count++;
    return count;
  }, [effectiveFilters, showRegionChip]);

  return (
    <div className='min-h-screen flex flex-col'>
      <main className='flex-1 px-4 py-8 max-w-7xl mx-auto w-full'>
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
            {effectiveFilters.type !== "all" && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    {PROPERTY_TYPE_LABELS[effectiveFilters.type] || "Тип недвижимости"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        <div className='mb-4'>
          <div className='relative max-w-xl flex gap-2 items-center'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none' />
              <Input
                placeholder='Город, район, ключевые слова...'
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                className='pl-9 h-12 text-base'
                aria-label='Поиск по объявлениям'
                autoComplete='off'
              />
              {draftQuery && (
                <button
                  onClick={() => {
                    setDraftQuery("");
                    handleQueryReset();
                  }}
                  className='absolute right-4 top-1/2 -translate-y-1/2 size-5 cursor-pointer text-muted-foreground'
                >
                  <XIcon className='size-5' />
                </button>
              )}
            </div>
            <div className='md:hidden shrink-0'>
              <MobileFilterDrawer
                appliedFilters={effectiveFilters}
                cities={cities}
                regionOptions={regionOptions}
                draftPriceMin={draftPriceMin}
                draftPriceMax={draftPriceMax}
                setDraftPriceMin={setDraftPriceMin}
                setDraftPriceMax={setDraftPriceMax}
                onTypeChange={handleTypeChange}
                onRegionChange={handleRegionChange}
                onCityChange={handleCityChange}
                onRoomsChange={handleRoomsChange}
                onAreaMinChange={handleAreaMinChange}
                onPriceMinBlur={handlePriceMinBlur}
                onPriceMaxBlur={handlePriceMaxBlur}
                onResetAll={handleResetAll}
                priceErrors={priceErrors}
                isPending={isPending}
              />
            </div>
          </div>
        </div>

        {/* <QuickPresets onPresetSelect={handlePresetSelect} /> */}

        <HorizontalFilters
          filters={effectiveFilters}
          cities={cities}
          regionOptions={regionOptions}
          localPriceMin={displayPriceMin}
          localPriceMax={displayPriceMax}
          localAreaMin={draftAreaMin}
          priceErrors={priceErrors}
          onTypeChange={handleTypeChange}
          onRegionChange={handleRegionChange}
          onCityChange={handleCityChange}
          onRoomsChange={handleRoomsChange}
          onSortChange={handleSortChange}
          onPriceMinChange={handlePriceMinChange}
          onPriceMaxChange={handlePriceMaxChange}
          onPriceMinBlur={handlePriceMinBlur}
          onPriceMaxBlur={handlePriceMaxBlur}
          onAreaMinChange={setDraftAreaMin}
          onAreaMinBlur={handleAreaMinBlur}
          onDealTypeChange={handleDealTypeChange}
        />

        <ActiveFilters
          filters={effectiveFilters}
          activeFiltersCount={activeFiltersCount}
          showRegionChip={showRegionChip}
          selectedCityName={selectedCityName}
          onTypeReset={handleTypeReset}
          onPriceReset={handlePriceReset}
          onRegionReset={handleRegionReset}
          onCityReset={handleCityReset}
          onRoomsReset={handleRoomsReset}
          onAreaReset={handleAreaReset}
          onQueryReset={handleQueryReset}
          onDealTypeReset={handleDealTypeReset}
          onFloorReset={handleFloorReset}
          onResetAll={handleResetAll}
        />

        <div>
          <div className='mb-6 ml-1 mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
            <h1 className='text-xl sm:text-2xl font-bold text-foreground'>
              Результаты поиска: {typeof data?.total === "number" ? data.total : 0}{" "}
              объявлений
            </h1>
          </div>

          <SearchResults
            properties={properties}
            isLoading={isLoading || isPending}
            error={error}
            currentPage={effectiveFilters.page}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onResetFilters={handleResetAll}
            onGoHome={() => router.push(ROUTES.home)}
            totalItems={data?.total}
            itemsPerPage={SEARCH_CONSTANTS.ITEMS_PER_PAGE}
          />
        </div>
      </main>
    </div>
  );
}
