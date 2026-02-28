"use client";

import type { ReactNode } from "react";
import type { Property } from "@/types/property";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PropertySpecsProps {
  property: Property;
  isDescriptionExpanded: boolean;
  onToggleDescription: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  apartment: "Квартира",
  house: "Дом",
  land: "Участок",
  commercial: "Коммерческая",
};

// Добавляем карту регионов с переводами на кириллицу
const REGION_LABELS: Record<string, string> = {
  Ingushetia: "Ингушетия",
  Dagestan: "Дагестан",
  Chechnya: "Чечня",
  KabardinoBalkaria: "Кабардино-Балкария",
  NorthOssetia: "Северная Осетия",
  // Добавить и другие регионы по необходимости
};

export function PropertySpecs({
  property,
  isDescriptionExpanded,
  onToggleDescription,
}: PropertySpecsProps) {
  // Получаем значение региона на кириллице, если доступно, иначе отображаем исходное значение
  const regionCyrillic = REGION_LABELS[property.region] || property.region;

  return (
    <>
      <div className='bg-card rounded-xl border border-border p-4 sm:p-6'>
        <h2 className='text-lg sm:text-xl font-semibold mb-4 sm:mb-6'>Характеристики</h2>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-y-3 sm:gap-y-4 gap-x-4 sm:gap-x-8'>
          <InfoRow label='Тип' value={TYPE_LABELS[property.type] || "Коммерческая"} />
          <InfoRow label='Площадь' value={`${property.area} м²`} />
          {property.rooms != null && <InfoRow label='Комнат' value={property.rooms} />}
          {property.floor != null && <InfoRow label='Этаж' value={property.floor} />}
          <InfoRow label='Регион' value={regionCyrillic} />
        </div>
      </div>

      <div className='bg-card rounded-xl border border-border p-6 overflow-hidden'>
        <h2 className='text-xl font-semibold mb-4'>Описание</h2>
        <div className='min-w-0'>
          <div
            className={`text-muted-foreground whitespace-pre-line wrap-break-word [overflow-wrap:anywhere]${!isDescriptionExpanded ? " line-clamp-5" : ""}`}
          >
            {property.description}
          </div>
          {property.description && property.description.length > 300 && (
            <Button
              variant='link'
              className='p-0 h-auto mt-2 text-primary'
              onClick={onToggleDescription}
              type='button'
            >
              {isDescriptionExpanded ? "Свернуть" : "Показать полностью"}
            </Button>
          )}
        </div>
      </div>

      {!!property.features?.length && (
        <div className='bg-card rounded-xl border border-border p-6'>
          <h2 className='text-xl font-semibold mb-4'>Удобства</h2>
          <div className='flex flex-wrap gap-2'>
            {property.features.map((feature, index) => (
              <Badge key={index} variant='secondary'>
                {feature}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

type InfoRowProps = { label: string; value: ReactNode };

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className='flex justify-between items-baseline border-b border-border/50 pb-2'>
      <span className='text-muted-foreground'>{label}</span>
      <span className='font-medium text-foreground'>{value}</span>
    </div>
  );
}
