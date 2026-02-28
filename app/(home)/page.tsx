"use client";

import { HeroSearch } from "@/components/features/hero-search";
import { CategoryShowcase } from "@/components/features/category-showcase";
import { PropertyGrid } from "@/components/features/property-grid";
import { PropertyGridSkeleton } from "@/components/features/property-grid-skeleton";
import { CTASection } from "@/components/features/cta-section";
import { useProperties } from "@/hooks/use-properties";

export default function HomePage() {
  const { data, isLoading } = useProperties({ limit: 12 });

  return (
    <div className='min-h-screen flex flex-col'>
      <main className='flex-1'>
        <HeroSearch />
        {/*<CategoryShowcase />*/}

        <section className='container mx-auto px-1 py-8 sm:py-12 md:py-16'>
          <div className='text-center mb-8 sm:mb-12'>
            <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4'>
              Лучшие предложения
            </h2>
          </div>
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
