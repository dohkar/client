"use client";

import { HeroSearch } from "@/components/features/hero-search";
import { CategoryShowcase } from "@/components/features/category-showcase";
import { HowItWorksSection } from "@/components/features/how-it-works-section";
import { PropertyGrid } from "@/components/features/property-grid";
import { CTASection } from "@/components/features/cta-section";
import { useProperties } from "@/hooks/use-properties";
import { Spinner } from "@/components/ui";

export default function HomePage() {
  const { data, isLoading } = useProperties({ limit: 6 });

  return (
    <div className='min-h-screen flex flex-col'>
      <main className='flex-1'>
        <HeroSearch />
        <CategoryShowcase />
        {/* <StatisticsSection /> */}
        {/* <FeaturesSection /> */}

        {/* Лучшие предложения */}
        <section className='container mx-auto px-4 py-8 sm:py-12 md:py-16'>
          <div className='text-center mb-8 sm:mb-12'>
            <h2 className='text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 sm:mb-4'>
              Лучшие предложения
            </h2>
            {/* <p className='text-muted-foreground text-sm sm:text-base'>
              Тщательно отобранные варианты недвижимости для вас
            </p> */}
          </div>
          {isLoading ? (
            <div className='flex justify-center items-center py-12'>
              <Spinner className='w-8 h-8' />
            </div>
          ) : (
            <PropertyGrid properties={data?.data || []} limit={6} />
          )}
        </section>

        {/* <PopularLocationsSection /> */}
        <HowItWorksSection />
        {/* <Testimonials /> */}
        <CTASection />
      </main>
    </div>
  );
}
