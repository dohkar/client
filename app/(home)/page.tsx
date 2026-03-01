"use client";

import { HeroSearch } from "@/components/features/hero-search";
import { PropertyGrid } from "@/components/features/property-grid";
import { PropertyGridSkeleton } from "@/components/features/property-grid-skeleton";
import { CTASection } from "@/components/features/cta-section";
import { useProperties } from "@/hooks/use-properties";
import { SearchHistorySection } from "@/components/features/search-history/search-history-section";
import { ViewHistorySection } from "@/components/features/view-history/view-history-section";

export default function HomePage() {
  const { data, isLoading } = useProperties({ limit: 12 });

  return (
    <div className='min-h-screen flex flex-col'>
      <main className='flex-1'>
        <HeroSearch />

        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between flex-col gap-1 sm:gap-2'>
          <SearchHistorySection />
          <ViewHistorySection />
        </div>

        {/* Секция объявлений — единый контейнер с hero (как на Авито) */}
        <section
          className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12'
          aria-label='Свежие объявления'
        >
          {isLoading ? (
            <PropertyGridSkeleton count={12} />
          ) : (
            <PropertyGrid properties={data?.data || []} limit={12} />
          )}
        </section>

        <CTASection />
      </main>
    </div>
  );
}
