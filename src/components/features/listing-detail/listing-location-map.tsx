"use client";

import { ExternalLink, MapPin } from "lucide-react";

import { yandexMapsPointUrl } from "@/lib/maps-external-link";
import { cn } from "@/lib/utils";

export interface ListingLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
}

/**
 * Блок расположения листинга: координаты и ссылка на внешние карты (без встраиваемого API).
 */
export function ListingLocationMap({
  latitude,
  longitude,
  className = "",
}: ListingLocationMapProps) {
  if (latitude != null && longitude != null) {
    const lng = longitude;
    const lat = latitude;
    return (
      <div className={cn("rounded-xl border border-border bg-card p-6", className)}>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <h2 className='text-xl font-semibold'>Расположение</h2>
            <p className='mt-2 flex items-start gap-2 text-sm text-muted-foreground'>
              <MapPin className='mt-0.5 h-4 w-4 shrink-0' aria-hidden />
              <span className='font-mono text-foreground/90'>
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </span>
            </p>
          </div>
          <a
            href={yandexMapsPointUrl(lng, lat)}
            target='_blank'
            rel='noopener noreferrer'
            className='inline-flex shrink-0 items-center gap-1.5 text-sm text-primary hover:underline'
          >
            <ExternalLink className='h-4 w-4' aria-hidden />
            Открыть на карте
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border bg-card p-6", className)}>
      <h2 className='mb-2 text-xl font-semibold'>Расположение</h2>
      <p className='text-sm text-muted-foreground'>
        Координаты не указаны. После указания адреса в объявлении здесь появятся точка на
        карте и координаты.
      </p>
    </div>
  );
}
