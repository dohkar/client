"use client";

import { YandexMap } from "@/components/features/yandex-map";
import type { Property } from "@/types/property";

interface PropertyMapSectionProps {
  property: Property;
}

export function PropertyMapSection({ property }: PropertyMapSectionProps) {
  if (property.latitude && property.longitude) {
    return (
      <div className='bg-card rounded-xl border border-border p-6'>
        <h2 className='text-xl font-semibold mb-4'>Расположение на карте</h2>
        <YandexMap
          latitude={property.latitude}
          longitude={property.longitude}
          zoom={15}
          height={400}
          markerTitle={property.title}
        />
      </div>
    );
  }

  return (
    <div className='bg-card rounded-xl border border-border p-6'>
      <h2 className='text-xl font-semibold mb-4'>Расположение на карте</h2>
      <p className='text-muted-foreground text-sm'>
        Координаты не указаны. Для отображения карты необходимо указать широту и
        долготу.
      </p>
    </div>
  );
}
