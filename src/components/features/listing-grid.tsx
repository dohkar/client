"use client";

import { ListingCard } from "./listing-card";
import { Empty } from "@/components/ui/empty";
import { Home } from "lucide-react";
import type { Listing } from "@/types/listing";

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
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2'>
          <h2 className='text-xl sm:text-2xl font-bold text-foreground'>
            Свежие объявления
          </h2>
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
