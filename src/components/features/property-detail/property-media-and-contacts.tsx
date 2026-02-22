"use client";

import type { Property } from "@/types/property";
import { formatPhone, getPhoneHref } from "@/lib/utils/format";

interface PropertyMediaAndContactsProps {
  property: Property;
}

export function PropertyMediaAndContacts({ property }: PropertyMediaAndContactsProps) {
  return (
    <>
      {!!property.videos?.length && (
        <div className='bg-card rounded-xl border border-border p-4 sm:p-6'>
          <h2 className='text-lg sm:text-xl font-semibold mb-4'>Видео</h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {property.videos.map((videoUrl) => (
              <video
                key={videoUrl}
                controls
                preload='metadata'
                className='w-full rounded-lg border bg-black'
                src={videoUrl}
              />
            ))}
          </div>
        </div>
      )}

      <div className='bg-card rounded-xl border border-border p-6'>
        <h2 className='text-xl font-semibold mb-4'>Контакты</h2>
        <div className='space-y-2'>
          <p className='text-foreground font-medium'>{property.contact?.name || "—"}</p>
          {property.contact?.phone ? (
            <a
              href={getPhoneHref(property.contact.phone)}
              className='text-muted-foreground hover:text-primary transition-colors block'
            >
              {formatPhone(property.contact.phone, "international")}
            </a>
          ) : (
            <span className='text-muted-foreground block'>Телефон не указан</span>
          )}
        </div>
      </div>
    </>
  );
}
