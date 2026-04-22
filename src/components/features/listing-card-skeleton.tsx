"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Скелетон карточки листинга — используется во время загрузки списков/поиска.
 */
export function ListingCardSkeleton() {
  return (
    <div className='h-full min-h-[410px] flex flex-col rounded-lg overflow-hidden border border-border bg-card w-full max-w-full mx-auto'>
      <Skeleton className='relative aspect-4/3 w-full rounded-none' />

      <div className='p-4 sm:p-5 space-y-2 sm:space-y-3 flex-1 flex flex-col'>
        <div className='space-y-1 flex items-center justify-between'>
          <Skeleton className='h-6 sm:h-7 w-32' />
          <Skeleton className='h-4 w-20' />
        </div>

        <Skeleton className='h-4 w-full' />
        <Skeleton className='h-4 w-4/5' />

        <div className='flex items-start gap-2'>
          <Skeleton className='h-3.5 w-3.5 sm:h-4 sm:w-4 mt-0.5 shrink-0 rounded' />
          <Skeleton className='h-4 flex-1 max-w-[80%]' />
        </div>

        <div className='flex items-center gap-2 sm:gap-3 pt-3 border-t border-border mt-auto'>
          <Skeleton className='h-4 w-14 rounded' />
          <Skeleton className='h-4 w-12 rounded' />
          <Skeleton className='h-4 w-16 rounded' />
        </div>
      </div>
    </div>
  );
}

