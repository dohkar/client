"use client";

import { useMemo, useEffect, useRef, useReducer } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Search, XIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useListings } from "@/hooks/use-listings";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useCities } from "@/hooks/use-cities";
import { useSegmentSearchFilters } from "@/hooks/use-segment-search-filters";
import { toListingSearchParams } from "@/lib/search-params";
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
  ListingsSearchResults,
} from "@/components/search";
import { MobileFilterDrawer } from "@/components/features/MobileFilterDrawer";
import { REAL_ESTATE_ONLY_LAUNCH } from "@/constants/config";
import type { ListingCategory } from "@/types/listing";

export interface SegmentRouteParams {
  region: string;
  category: string;
  dealType?: string;
}

interface SearchPageClientProps {
  params: SegmentRouteParams;
  searchParams?: Record<string, string | string[] | undefined>;
}

function mapCategorySlugToListingCategory(slug: string): ListingCategory {
  switch (slug) {
    case "nedvizhimost":
    case "kvartiry":
    case "doma":
    case "uchastki":
    case "kommercheskaya_nedvizhimost":
      return "REAL_ESTATE";
    case "transport":
      return "VEHICLE";
    case "elektronika":
      return "ELECTRONICS";
    default:
      return "REAL_ESTATE";
  }
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
    currentPage,
    setCurrentPage,
    isPending,
  } = useSegmentSearchFilters(params, searchParams);

  const regionCacheInitRef = useRef(false);
  const [, forceRender] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    if (regionCacheInitRef.current) return;
    regionCacheInitRef.current = true;

    ensureRegionCacheInitialized()
      .then(() => {
        forceRender();
        queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      })
      .catch(() => {});
  }, [queryClient]);

  const regionId =
    appliedFilters.region !== "all"
      ? getRegionIdByName(appliedFilters.region)
      : undefined;

  const { data: cities = [] } = useCities(regionId ?? undefined);
  const selectedCityName =
    appliedFilters.cityId != null
      ? (cities.find((city) => city.id === appliedFilters.cityId)?.name ?? null)
      : null;

  const listingCategory = useMemo((): ListingCategory => {
    if (REAL_ESTATE_ONLY_LAUNCH) return "REAL_ESTATE";
    return mapCategorySlugToListingCategory(params.category);
  }, [params.category]);

  const baseApiParams = useMemo(
    () =>
      toListingSearchParams(
        appliedFilters,
        SEARCH_CONSTANTS.ITEMS_PER_PAGE,
        listingCategory
      ),
    [appliedFilters, listingCategory]
  );

  const { data, isLoading, error } = useListings({
    ...baseApiParams,
    regionId,
    cityId: appliedFilters.cityId ?? undefined,
  });

  const listings = Array.isArray(data?.data) ? data.data : [];
  const totalPages = typeof data?.totalPages === "number" ? data.totalPages : 0;

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.query && appliedFilters.query.trim().length > 0) count++;
    if (appliedFilters.dealType && appliedFilters.dealType !== "all") count++;
    if (appliedFilters.type && appliedFilters.type !== "all") count++;
    if (appliedFilters.priceMin != null) count++;
    if (appliedFilters.priceMax != null) count++;
    if (appliedFilters.roomsMin != null) count++;
    if (appliedFilters.areaMin != null) count++;
    if (
      appliedFilters.floorMin != null ||
      appliedFilters.floorMax != null ||
      appliedFilters.floorNotFirst === true
    )
      count++;
    if (showRegionChip && appliedFilters.region && appliedFilters.region !== "all")
      count++;
    if (appliedFilters.cityId && appliedFilters.cityId.trim().length > 0) count++;
    return count;
  }, [appliedFilters, showRegionChip]);

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
                appliedFilters={appliedFilters}
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

        <HorizontalFilters
          filters={appliedFilters}
          cities={cities}
          regionOptions={regionOptions}
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
          onDealTypeChange={handleDealTypeChange}
        />

        <ActiveFilters
          filters={appliedFilters}
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

          <ListingsSearchResults
            listings={listings}
            isLoading={isLoading || isPending}
            error={error}
            currentPage={currentPage}
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
