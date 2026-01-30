"use client";

import { PropertyCardSkeleton } from "./property-card-skeleton";

interface PropertyGridSkeletonProps {
  /** Количество карточек-скелетонов (по умолчанию 6 — как в секции «Лучшие предложения») */
  count?: number;
}

/**
 * Сетка скелетонов карточек недвижимости — для анимации загрузки секций с объявлениями.
 * Повторяет разметку PropertyGrid (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3).
 */
export function PropertyGridSkeleton({ count = 6 }: PropertyGridSkeletonProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: count }, (_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
