"use client";

import { ListingCard } from "./listing-card";
import { Empty } from "@/components/ui/empty";
import { Home } from "lucide-react";
import type { Listing } from "@/types/listing";
import Link from "next/link";

interface ListingGridProps {
  listings?: Listing[];
  showHeader?: boolean;
  limit?: number;
}

/**
 * Сетка объявлений (listing-first), единый формат с поиском и каталогом.
 */
export function ListingGrid({
  listings: items = [],
  showHeader = true,
  limit,
}: ListingGridProps) {
  const displayed = limit ? items.slice(0, limit) : items;

  if (displayed.length === 0) {
    return (
      <Empty
        icon={<Home className='text-muted-foreground' />}
        title='Объявления не найдены'
        description='Попробуйте изменить параметры поиска или фильтры'
      />
    );
  }

  return (
    <div className='w-full space-y-5 sm:space-y-6'>
      {showHeader && (
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-2 py-2 bg-background rounded-lg border border-border shadow-sm'>
          <div className='flex items-center gap-2'>
            <Home className='w-6 h-6 text-primary' />
            <h2 className='text-xl sm:text-2xl font-bold text-foreground'>
              Свежие объявления
            </h2>
          </div>
          <Link
            href={`/all/nedvizhimost`}
            className='inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-md bg-muted text-muted-foreground hover:bg-primary/10 hover:text-foreground transition-colors border border-transparent hover:border-primary'
          >
            <span>Перейти в каталог</span>
            <svg
              className='w-4 h-4'
              fill='none'
              stroke='currentColor'
              strokeWidth={2}
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' />
            </svg>
          </Link>
        </div>
      )}

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5'>
        {displayed.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
