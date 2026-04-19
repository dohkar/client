"use client";

import { ListingCard } from "./listing-card";
import { Empty } from "@/components/ui/empty";
import { Home } from "lucide-react";
import type { Listing } from "@/types/listing";
import Link from "next/link";
import { Button } from "../ui";
import { buildSearchUrl } from "@/lib/url/segments";
import { DEFAULT_SEARCH_CATEGORY } from "@/constants/defaults";

const CATALOG_HREF = buildSearchUrl({
  region: "all",
  category: DEFAULT_SEARCH_CATEGORY,
});

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
        <div className='flex justify-between items-center px-2 py-2'>
          <h2 className='text-2xl font-bold text-foreground'>Свежие объявления</h2>
          <Button variant='link' asChild className='h-auto p-0'>
            <Link href={CATALOG_HREF} className='inline-flex items-center gap-2 group'>
              Перейти в каталог →
            </Link>
          </Button>
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
