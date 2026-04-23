"use client";

import { useMemo } from "react";
import { HeroSearch } from "@/components/features/hero-search";
import { ListingGrid } from "@/components/features/listing-grid";
import { ListingGridSkeleton } from "@/components/features/listing-grid-skeleton";
import { CTASection } from "@/components/features/cta-section";
import { useListings } from "@/hooks/use-listings";
import { SearchHistorySection } from "@/components/features/search-history/search-history-section";
import { ViewHistorySection } from "@/components/features/view-history/view-history-section";

export default function HomePage() {
  const homeListParams = useMemo(
    () => ({ limit: 12, sortBy: "date-desc" as const, category: "REAL_ESTATE" as const }),
    []
  );
  const { data, isLoading } = useListings(homeListParams);

  return (
    <div className='min-h-screen flex flex-col'>
      <main className='flex-1'>
        <HeroSearch />

        <div className='max-w-7xl mx-auto mt-2 px-4 sm:px-6 lg:px-8 flex justify-between flex-col gap-1 sm:gap-2'>
          <SearchHistorySection />
          <ViewHistorySection />
        </div>

        {/* Секция объявлений — единый контейнер с hero (как на Авито) */}
        <section
          className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12'
          aria-label='Свежие объявления'
        >
          {isLoading ? (
            <ListingGridSkeleton count={12} />
          ) : (
            <ListingGrid listings={data?.data || []} limit={12} />
          )}
        </section>

        <CTASection />
      </main>
    </div>
  );
}
