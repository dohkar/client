"use client";

import { ListingCardSkeleton } from "./listing-card-skeleton";

interface ListingGridSkeletonProps {
  count?: number;
}

/**
 * Сетка скелетонов карточек листингов — для загрузки секций с объявлениями.
 */
export function ListingGridSkeleton({ count = 8 }: ListingGridSkeletonProps) {
  return (
    <div className='w-full space-y-5 sm:space-y-6'>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5'>
        {Array.from({ length: count }, (_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

