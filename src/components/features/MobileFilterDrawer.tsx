"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter, Building2, DollarSign, Ruler, MapPin } from "lucide-react";
import { useUIStore } from "@/stores";
import { PROPERTY_TYPE_OPTIONS, REGION_OPTIONS } from "@/lib/search-constants";
import { CitySearchSelect } from "@/components/features/CitySearchSelect";
import type { SearchFiltersDisplay } from "@/lib/search-params";
import type { CityDto } from "@/types/property";

export type RegionOption = { value: string; label: string };

interface PriceValidationErrors {
  priceMin?: string;
  priceMax?: string;
}

function validatePrices(min: string, max: string): PriceValidationErrors {
  const errors: PriceValidationErrors = {};
  const minNum = min.trim() ? Number(min.trim()) : null;
  const maxNum = max.trim() ? Number(max.trim()) : null;

  if (minNum !== null && maxNum !== null && minNum > maxNum) {
    errors.priceMin = "Минимальная цена не может быть больше максимальной";
    errors.priceMax = "Максимальная цена не может быть меньше минимальной";
  }
  if (minNum !== null && minNum < 0) {
    errors.priceMin = "Цена не может быть отрицательной";
  }
  if (maxNum !== null && maxNum < 0) {
    errors.priceMax = "Цена не может быть отрицательной";
  }

  return errors;
}

export interface MobileFilterDrawerProps {
  appliedFilters: SearchFiltersDisplay;
  cities: CityDto[];
  regionOptions?: RegionOption[];
  onApply: (updates: Partial<SearchFiltersDisplay>) => void;
  isPending: boolean;
}

export function MobileFilterDrawer({
  appliedFilters: filters,
  cities,
  regionOptions: regionOptionsProp,
  onApply,
  isPending,
}: MobileFilterDrawerProps) {
  const { isFilterModalOpen, openFilterModal, closeFilterModal } = useUIStore();
  const regionOptions = regionOptionsProp ?? REGION_OPTIONS;

  const [draftType, setDraftType] = useState<SearchFiltersDisplay["type"]>("all");
  const [draftRegion, setDraftRegion] = useState<SearchFiltersDisplay["region"]>("all");
  const [draftCityId, setDraftCityId] = useState<string | null>(null);
  const [draftRoomsMin, setDraftRoomsMin] = useState<number | null>(null);
  const [draftAreaMin, setDraftAreaMin] = useState<string>("");
  const [draftPriceMin, setDraftPriceMin] = useState<string>("");
  const [draftPriceMax, setDraftPriceMax] = useState<string>("");
  const [priceErrors, setPriceErrors] = useState<PriceValidationErrors>({});

  const isDraftDirty = useMemo(() => {
    const appliedAreaStr = filters.areaMin != null ? String(filters.areaMin) : "";
    const appliedPriceMinStr = filters.priceMin != null ? String(filters.priceMin) : "";
    const appliedPriceMaxStr = filters.priceMax != null ? String(filters.priceMax) : "";

    return (
      draftType !== filters.type ||
      draftRegion !== filters.region ||
      (draftCityId ?? null) !== (filters.cityId ?? null) ||
      draftRoomsMin !== (filters.roomsMin ?? null) ||
      draftAreaMin !== appliedAreaStr ||
      draftPriceMin !== appliedPriceMinStr ||
      draftPriceMax !== appliedPriceMaxStr
    );
  }, [
    draftAreaMin,
    draftCityId,
    draftPriceMax,
    draftPriceMin,
    draftRegion,
    draftRoomsMin,
    draftType,
    filters.areaMin,
    filters.cityId,
    filters.priceMax,
    filters.priceMin,
    filters.region,
    filters.roomsMin,
    filters.type,
  ]);

  useEffect(() => {
    if (!isFilterModalOpen) return;
    setDraftType(filters.type);
    setDraftRegion(filters.region);
    setDraftCityId(filters.cityId ?? null);
    setDraftRoomsMin(filters.roomsMin ?? null);
    setDraftAreaMin(filters.areaMin != null ? String(filters.areaMin) : "");
    setDraftPriceMin(filters.priceMin != null ? String(filters.priceMin) : "");
    setDraftPriceMax(filters.priceMax != null ? String(filters.priceMax) : "");
    setPriceErrors({});
  }, [isFilterModalOpen, filters]);

  const hasActiveFilters =
    Boolean(filters.query?.trim()) ||
    filters.type !== "all" ||
    (filters.dealType && filters.dealType !== "all") ||
    filters.priceMin != null ||
    filters.priceMax != null ||
    filters.roomsMin != null ||
    filters.areaMin != null ||
    filters.region !== "all" ||
    (filters.cityId != null && filters.cityId.trim().length > 0) ||
    filters.floorMin != null ||
    filters.floorMax != null ||
    filters.floorNotFirst === true ||
    filters.newBuilding === true;

  return (
    <>
      {/* Кнопка фильтра хорошо видна и индикатор новых фильтров добавляет интерактивности */}
      <Button
        variant='outline'
        className='md:hidden gap-2 shadow-sm hover:shadow-md transition-shadow'
        onClick={openFilterModal}
        aria-label='Открыть фильтры'
      >
        <Filter className='h-4 w-4' />
        {hasActiveFilters && (
          <span
            className='ml-1 h-2 w-2 rounded-full bg-primary animate-pulse'
            aria-hidden
          />
        )}
      </Button>

      <Sheet
        open={isFilterModalOpen}
        onOpenChange={(open) => {
          if (open) {
            openFilterModal();
          } else {
            closeFilterModal();
          }
        }}
      >
        <SheetContent
          side='bottom'
          className='rounded-t-2xl h-[85vh] p-0 flex flex-col overflow-hidden'
        >
          <SheetHeader className='pb-2 shrink-0'>
            <div className='mx-auto mt-2 h-1.5 w-10 rounded-full bg-muted' aria-hidden />
            <SheetTitle className='flex items-center gap-2'>
              <div className='p-1.5 rounded-lg bg-primary/10'>
                <Filter className='h-5 w-5 text-primary' />
              </div>
              Фильтры поиска
            </SheetTitle>
          </SheetHeader>

          <div className='space-y-6 px-4 pb-6 overflow-y-auto flex-1'>
            {/* Тип недвижимости */}
            <div>
              <label className='flex items-center gap-2 text-sm font-semibold text-foreground mb-3'>
                <Building2 className='w-4 h-4 text-muted-foreground' />
                Тип недвижимости
              </label>
              <Select
                value={draftType}
                onValueChange={(v) => setDraftType(v as SearchFiltersDisplay["type"])}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Выберите тип' />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Цена */}
            <div>
              <label className='flex items-center gap-2 text-sm font-semibold text-foreground mb-3'>
                <DollarSign className='w-4 h-4 text-muted-foreground' />
                Цена (₽)
              </label>
              <div className='space-y-2'>
                <div className='relative'>
                  {/* UX: Добавить step=1000 чтобы быстрее задавать цену */}
                  <Input
                    type='number'
                    step={1000}
                    placeholder='От'
                    min={0}
                    value={draftPriceMin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setDraftPriceMin(val);
                    }}
                    className={`pl-9 ${priceErrors.priceMin ? "border-destructive" : ""}`}
                    autoComplete='off'
                    inputMode='numeric'
                  />
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm'>
                    от
                  </span>
                </div>
                <div className='relative'>
                  <Input
                    type='number'
                    step={1000}
                    placeholder='До'
                    min={0}
                    value={draftPriceMax}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setDraftPriceMax(val);
                    }}
                    className={`pl-9 ${priceErrors.priceMax ? "border-destructive" : ""}`}
                    autoComplete='off'
                    inputMode='numeric'
                  />
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm'>
                    до
                  </span>
                </div>
                {(priceErrors.priceMin || priceErrors.priceMax) && (
                  <div className='text-xs text-destructive space-y-1'>
                    {priceErrors.priceMin && <p>{priceErrors.priceMin}</p>}
                    {priceErrors.priceMax && <p>{priceErrors.priceMax}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Комнаты */}
            <div>
              <label className='flex items-center gap-2 text-sm font-semibold text-foreground mb-3'>
                <Building2 className='w-4 h-4 text-muted-foreground' />
                Комнат минимум
              </label>
              <div className='grid grid-cols-5 gap-2'>
                {["0", "1", "2", "3", "4+"].map((option) => {
                  const optionValue = option === "4+" ? 4 : Number(option);
                  const isSelected =
                    draftRoomsMin !== null && draftRoomsMin === optionValue;
                  return (
                    <Button
                      key={option}
                      variant={isSelected ? "default" : "outline"}
                      size='sm'
                      onClick={() => setDraftRoomsMin(optionValue)}
                      className='min-h-[44px] transition-all hover:scale-105'
                    >
                      {option}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Площадь */}
            <div>
              <label className='flex items-center gap-2 text-sm font-semibold text-foreground mb-3'>
                <Ruler className='w-4 h-4 text-muted-foreground' />
                Площадь (м²) минимум
              </label>
              <div className='relative'>
                <Input
                  type='number'
                  step={1}
                  placeholder='От'
                  min={0}
                  value={draftAreaMin}
                  onChange={(e) => setDraftAreaMin(e.target.value.replace(/\D/g, ""))}
                  className='pl-9'
                  autoComplete='off'
                />
                <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm'>
                  от
                </span>
              </div>
            </div>

            {/* Регион */}
            <div>
              <label className='flex items-center gap-2 text-sm font-semibold text-foreground mb-3'>
                <MapPin className='w-4 h-4 text-muted-foreground' />
                Регион
              </label>
              <Select
                value={draftRegion}
                onValueChange={(v) => {
                  setDraftRegion(v as SearchFiltersDisplay["region"]);
                  setDraftCityId(null);
                }}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Выберите регион' />
                </SelectTrigger>
                <SelectContent>
                  {regionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Город */}
            <div>
              <CitySearchSelect
                label='Город'
                value={draftCityId ?? ""}
                onValueChange={(value) => setDraftCityId(value || null)}
                cities={cities}
                placeholder={cities.length === 0 ? "Загрузка городов…" : "Все города"}
              />
            </div>
          </div>

          <div className='border-t bg-background p-4 flex gap-2 shrink-0 pb-[calc(env(safe-area-inset-bottom)+1rem)]'>
            <Button
              variant='outline'
              onClick={() => {
                setDraftType("all");
                setDraftRegion("all");
                setDraftCityId(null);
                setDraftRoomsMin(null);
                setDraftAreaMin("");
                setDraftPriceMin("");
                setDraftPriceMax("");
                setPriceErrors({});
              }}
              className='flex-1'
            >
              Сбросить
            </Button>
            <Button
              onClick={() => {
                const errs = validatePrices(draftPriceMin, draftPriceMax);
                if (Object.keys(errs).length > 0) {
                  setPriceErrors(errs);
                  return;
                }
                setPriceErrors({});

                const updates: Partial<SearchFiltersDisplay> = {
                  type: draftType,
                  region: draftRegion,
                  cityId: draftRegion === "all" ? null : (draftCityId ?? null),
                  roomsMin: draftRoomsMin,
                  areaMin: draftAreaMin.trim() ? Number(draftAreaMin.trim()) : null,
                  priceMin: draftPriceMin.trim() ? Number(draftPriceMin.trim()) : null,
                  priceMax: draftPriceMax.trim() ? Number(draftPriceMax.trim()) : null,
                };

                onApply(updates);
                closeFilterModal();
              }}
              disabled={isPending}
              className='flex-1'
            >
              {isPending ? "Применяем…" : isDraftDirty ? "Применить" : "Готово"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
