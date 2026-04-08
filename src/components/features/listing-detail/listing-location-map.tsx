"use client";

import { ExternalLink } from "lucide-react";

import { YandexMap } from "@/components/features/yandex-map";
import { cn } from "@/lib/utils";

function yandexMapsUrl(lng: number, lat: number, z = 17): string {
  return `https://yandex.ru/maps/?pt=${lng},${lat}&z=${z}`;
}

export interface ListingLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
}

/**
 * Карта объекта (листинг): те же координаты, что и у PropertyMapSection.
 */
export function ListingLocationMap({
  latitude,
  longitude,
  className = "",
}: ListingLocationMapProps) {
  if (latitude != null && longitude != null) {
    const center: [number, number] = [longitude, latitude];
    return (
      <div className={cn("rounded-xl border border-border bg-card p-6", className)}>
        <div className='mb-4 flex items-center justify-between gap-3'>
          <h2 className='text-xl font-semibold'>Расположение на карте</h2>
          <a
            href={yandexMapsUrl(center[0], center[1])}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex shrink-0 items-center gap-1 text-sm text-primary hover:underline'
          >
            <ExternalLink className='h-4 w-4' aria-hidden />
            Открыть в Яндекс.Картах
          </a>
        </div>
        <YandexMap center={center} markerPosition={center} zoom={17} height={400} />
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card p-6", className)}>
      <h2 className='mb-4 text-xl font-semibold'>Расположение на карте</h2>
      <p className='text-sm text-muted-foreground'>
        Координаты не указаны. Для отображения карты необходимо указать широту и долготу.
      </p>
    </div>
  );
}
