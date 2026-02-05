"use client";

import { PropertyCard } from "./property-card";
import { Empty } from "@/components/ui/empty";
import { Home } from "lucide-react";
import type { Property } from "@/types/property";

interface PropertyGridProps {
  properties?: Property[];
  showHeader?: boolean;
  limit?: number;
}

export function PropertyGrid({
  properties: propsProperties = [],
  showHeader = true,
  limit,
}: PropertyGridProps) {
  const properties = propsProperties;

  const displayedProperties = limit ? properties.slice(0, limit) : properties;

  if (displayedProperties.length === 0) {
    return (
      <Empty
        icon={<Home className='text-muted-foreground' />}
        title='Объявления не найдены'
        description='Попробуйте изменить параметры поиска или фильтры'
      />
    );
  }

  return (
    <div className='space-y-4 sm:space-y-6'>
      {/* {showHeader && (
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4'>
          <h2 className='text-xl sm:text-2xl font-bold text-foreground'>
            Свежие объявления
          </h2>
        </div>
      )} */}

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 sm:gap-4'>
        {displayedProperties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </div>
  );
}
