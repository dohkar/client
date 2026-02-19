"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { PropertyCard } from "@/components/features/property-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecommendations } from "@/hooks/use-recommendations";
import { useIsMobile } from "@/hooks/use-media-query";
import { adaptProperty } from "@/lib/property-adapter";
import { cn } from "@/lib/utils";

interface RecommendationsBlockProps {
  title?: string;
  excludeIds?: string[];
  limit?: number;
  className?: string;
  showReasonBadge?: boolean;
}

export function RecommendationsBlock({
  title = "Рекомендуем для вас",
  excludeIds,
  limit = 8,
  className,
  showReasonBadge = true,
}: RecommendationsBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { rootMargin: "200px" }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { data, isLoading } = useRecommendations({
    limit,
    excludeIds,
    enabled: isVisible,
  });

  const items = useMemo(
    () =>
      (data ?? []).map((item) => ({
        ...item,
        property: adaptProperty(item.property),
      })),
    [data]
  );

  if (!isLoading && (!items || items.length === 0)) return null;

  return (
    <section ref={containerRef} className={cn("container mx-auto px-4 py-8", className)}>
      <h2 className='text-xl font-semibold mb-4'>{title}</h2>

      {isLoading ? (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className='space-y-3'>
              <Skeleton className='h-[220px] w-full rounded-xl' />
              <Skeleton className='h-4 w-2/3' />
              <Skeleton className='h-4 w-1/2' />
            </div>
          ))}
        </div>
      ) : isMobile ? (
        <div className='overflow-hidden' ref={emblaRef}>
          <div className='flex -ml-4'>
            {items.map((item) => (
              <div key={item.property.id} className='pl-4 basis-[85%] min-w-0'>
                <PropertyCard
                  property={item.property}
                  recommendationReason={showReasonBadge ? item.reason : undefined}
                  recommendationSource='related'
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4'>
          {items.map((item) => (
            <PropertyCard
              key={item.property.id}
              property={item.property}
              recommendationReason={showReasonBadge ? item.reason : undefined}
              recommendationSource='related'
            />
          ))}
        </div>
      )}
    </section>
  );
}
