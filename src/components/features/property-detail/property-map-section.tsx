"use client";

import type { Property } from "@/types/property";
import { ExternalLink, MapPin } from "lucide-react";

import { yandexMapsPointUrl } from "@/lib/maps-external-link";

interface PropertyMapSectionProps {
  property: Property;
}

export function PropertyMapSection({ property }: PropertyMapSectionProps) {
  if (property.latitude != null && property.longitude != null) {
    const lng = property.longitude;
    const lat = property.latitude;
    return (
      <div className='bg-card rounded-xl border border-border p-6'>
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
    <div className='bg-card rounded-xl border border-border p-6'>
      <h2 className='text-xl font-semibold mb-2'>Расположение</h2>
      <p className='text-muted-foreground text-sm'>
        Координаты не указаны. После указания адреса в объявлении здесь появятся точка на
        карте и координаты.
      </p>
    </div>
  );
}
