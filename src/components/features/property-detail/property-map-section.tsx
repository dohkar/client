"use client";

import { YandexMap } from "@/components/features/yandex-map";
import type { Property } from "@/types/property";
import { ExternalLink } from "lucide-react";

interface PropertyMapSectionProps {
  property: Property;
}

function yandexMapsUrl(lng: number, lat: number, z = 17): string {
  return `https://yandex.ru/maps/?pt=${lng},${lat}&z=${z}`;
}

export function PropertyMapSection({ property }: PropertyMapSectionProps) {
  if (property.latitude != null && property.longitude != null) {
    const center: [number, number] = [property.longitude, property.latitude];
    return (
      <div className='bg-card rounded-xl border border-border p-6'>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-semibold'>Расположение на карте</h2>
          <a
            href={yandexMapsUrl(center[0], center[1])}
            target='_blank'
            rel='noopener noreferrer'
            className='text-sm text-primary hover:underline inline-flex items-center gap-1'
          >
            <ExternalLink className='w-4 h-4' aria-hidden />
            Открыть в Яндекс.Картах
          </a>
        </div>
        <YandexMap
          center={center}
          markerPosition={center}
          zoom={17}
          height={400}
        />
      </div>
    );
  }

  return (
    <div className='bg-card rounded-xl border border-border p-6'>
      <h2 className='text-xl font-semibold mb-4'>Расположение на карте</h2>
      <p className='text-muted-foreground text-sm'>
        Координаты не указаны. Для отображения карты необходимо указать широту и долготу.
      </p>
    </div>
  );
}
