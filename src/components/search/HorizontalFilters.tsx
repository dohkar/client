"use client";

import { useState } from "react";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { SearchFiltersDisplay } from "@/lib/search-params";
import {
  PROPERTY_TYPE_OPTIONS,
  REGION_OPTIONS,
  ROOMS_OPTIONS,
  SORT_OPTIONS,
} from "@/lib/search-constants";
import {
  getTypeLabel,
  getRegionLabel,
  getPriceLabel,
  getRoomsLabel,
  getAreaLabel,
  getCityLabel,
} from "./FilterLabels";
import type { CityDto } from "@/types/property";
import type { PriceValidationErrors } from "@/hooks/use-search-filters";

interface HorizontalFiltersProps {
  filters: SearchFiltersDisplay;
  cities: CityDto[];
  localPriceMin: string;
  localPriceMax: string;
  localAreaMin?: string;
  priceErrors?: PriceValidationErrors;
  onTypeChange: (type: SearchFiltersDisplay["type"]) => void;
  onRegionChange: (region: SearchFiltersDisplay["region"]) => void;
  onCityChange: (cityId: string | null) => void;
  onRoomsChange: (rooms: number | null) => void;
  onSortChange: (sortBy: SearchFiltersDisplay["sortBy"]) => void;
  onPriceMinChange: (value: string) => void;
  onPriceMaxChange: (value: string) => void;
  onPriceMinBlur: () => void;
  onPriceMaxBlur: () => void;
  onAreaMinChange: (value: string) => void;
  onAreaMinBlur: () => void;
}

export function HorizontalFilters({
  filters,
  cities,
  localPriceMin,
  localPriceMax,
  localAreaMin = "",
  priceErrors = {},
  onTypeChange,
  onRegionChange,
  onCityChange,
  onRoomsChange,
  onSortChange,
  onPriceMinChange,
  onPriceMaxChange,
  onPriceMinBlur,
  onPriceMaxBlur,
  onAreaMinChange,
  onAreaMinBlur,
}: HorizontalFiltersProps) {
  const selectedCityName = filters.cityId
    ? (cities.find((c) => c.id === filters.cityId)?.name ?? null)
    : null;
  const [cityPopoverOpen, setCityPopoverOpen] = useState(false);
  return (
    <div
      className='w-full overflow-x-auto py-2 hide-scrollbar'
      style={{
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* Горизонтальная панель фильтров (адаптивно) */}
      <div
        className='
          flex flex-nowrap items-stretch gap-2
          snap-x snap-mandatory
          md:gap-3
          max-w-full
        '
      >
        {/* Тип недвижимости */}
        <div className='w-[140px] min-w-0 shrink-0 sm:w-[160px]'>
          <Select value={filters.type} onValueChange={onTypeChange}>
            <SelectTrigger className='h-10 sm:h-11 px-3 text-xs sm:text-base w-full min-w-0 flex-shrink-0'>
              <SelectValue>{getTypeLabel(filters.type)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PROPERTY_TYPE_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className='text-xs sm:text-sm'
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Цена - Popover с инпутами */}
        <div className='min-w-[120px] flex-shrink-0'>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className='h-10 sm:h-11 px-4 w-full justify-between text-xs sm:text-base'
              >
                <span className='truncate max-w-[70px] sm:max-w-[110px]'>
                  {getPriceLabel(filters)}
                </span>
                <ChevronDown className='w-4 h-4 opacity-50 shrink-0' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-72 sm:w-80 p-4' align='start' sideOffset={8}>
              <div className='space-y-3'>
                <div className='flex gap-3'>
                  <div className='relative w-1/2'>
                    <Input
                      type='text'
                      placeholder='0'
                      value={localPriceMin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, "");
                        onPriceMinChange(val);
                      }}
                      onBlur={onPriceMinBlur}
                      className={`pl-9 text-xs sm:text-base ${priceErrors.priceMin ? "border-destructive" : ""}`}
                      autoComplete='off'
                      inputMode='numeric'
                    />
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm'>
                      от
                    </span>
                  </div>
                  <div className='relative w-1/2'>
                    <Input
                      type='text'
                      placeholder='5 000 000'
                      value={localPriceMax}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d]/g, "");
                        onPriceMaxChange(val);
                      }}
                      onBlur={onPriceMaxBlur}
                      className={`pl-9 text-xs sm:text-base ${priceErrors.priceMax ? "border-destructive" : ""}`}
                      autoComplete='off'
                      inputMode='numeric'
                    />
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm'>
                      до
                    </span>
                  </div>
                </div>
                {(priceErrors.priceMin || priceErrors.priceMax) && (
                  <div className='text-xs text-destructive space-y-1'>
                    {priceErrors.priceMin && <p>{priceErrors.priceMin}</p>}
                    {priceErrors.priceMax && <p>{priceErrors.priceMax}</p>}
                  </div>
                )}
                {/* <Button
                  type="button"
                  className="w-full bg-primary text-primary-foreground text-xs sm:text-base"
                  onClick={(e) => {
                    e.preventDefault();
                    onPriceMinBlur();
                    onPriceMaxBlur();
                  }}
                >
                  Готово
                </Button> */}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Регион */}
        <div className='w-[130px] min-w-0 shrink-0 sm:w-[160px]'>
          <Select value={filters.region} onValueChange={onRegionChange}>
            <SelectTrigger className='h-10 sm:h-11 px-3 text-xs sm:text-base w-full'>
              <SelectValue>{getRegionLabel(filters.region)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {REGION_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className='text-xs sm:text-sm'
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Город */}
        <div className='w-[140px] min-w-0 shrink-0 sm:w-[180px]'>
          <Popover open={cityPopoverOpen} onOpenChange={setCityPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className='h-10 sm:h-11 px-3 w-full justify-between text-xs sm:text-base'
              >
                <span className='truncate'>{getCityLabel(selectedCityName)}</span>
                <ChevronDown className='w-4 h-4 opacity-50 shrink-0' />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className='w-[var(--radix-popover-trigger-width)] max-h-[280px] overflow-hidden flex flex-col p-0'
              align='start'
              sideOffset={8}
            >
              <div className='p-2 border-b shrink-0'>
                <button
                  type='button'
                  className='w-full text-left text-xs sm:text-sm py-1.5 px-2 rounded hover:bg-accent'
                  onClick={() => {
                    onCityChange(null);
                    setCityPopoverOpen(false);
                  }}
                >
                  Все города
                </button>
              </div>
              <div className='overflow-y-auto flex-1 min-h-0'>
                {cities.map((city) => (
                  <button
                    key={city.id}
                    type='button'
                    className='w-full text-left text-xs sm:text-sm py-2 px-3 hover:bg-accent truncate'
                    onClick={() => {
                      onCityChange(city.id);
                      setCityPopoverOpen(false);
                    }}
                  >
                    {city.name}
                  </button>
                ))}
                {cities.length === 0 && (
                  <div className='py-4 text-center text-xs text-muted-foreground'>
                    Нет городов
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Комнаты */}
        <div className='w-[100px] min-w-0 shrink-0 sm:w-[120px]'>
          <Select
            value={filters.roomsMin?.toString() || "all"}
            onValueChange={(value) =>
              onRoomsChange(value === "all" ? null : Number(value))
            }
          >
            <SelectTrigger className='h-8 sm:h-9 px-3 text-xs sm:text-base w-full'>
              <SelectValue>{getRoomsLabel(filters.roomsMin)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ROOMS_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className='text-xs sm:text-sm'
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Площадь - Popover с инпутом */}
        <div className='min-w-[120px] flex-shrink-0'>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className='h-8 sm:h-9 px-3 w-full justify-between text-xs sm:text-base'
              >
                <span className='truncate max-w-[60px] sm:max-w-[90px]'>
                  {getAreaLabel(filters.areaMin)}
                </span>
                <ChevronDown className='w-4 h-4 opacity-50 shrink-0' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-36 sm:w-48 p-4' align='start' sideOffset={8}>
              <div className='space-y-3'>
                <div className='relative'>
                  <Input
                    type='text'
                    placeholder='От'
                    value={localAreaMin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, "");
                      onAreaMinChange(val);
                    }}
                    onBlur={onAreaMinBlur}
                    className='pl-9 text-xs sm:text-base'
                    autoComplete='off'
                    inputMode='numeric'
                  />
                  <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs sm:text-sm'>
                    от
                  </span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Сортировка */}
        <div className='min-w-[120px] flex-shrink-0 ml-auto snap-end'>
          <Select value={filters.sortBy} onValueChange={onSortChange}>
            <SelectTrigger className='h-8 sm:h-9 px-3 w-full text-xs sm:text-base'>
              <ArrowUpDown className='w-4 h-4 mr-2 opacity-50 hidden sm:block' />
              <SelectValue>
                {SORT_OPTIONS.find((opt) => opt.value === filters.sortBy)?.label ||
                  "По популярности"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className='text-xs sm:text-sm'
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Hide scrollbar on Webkit browsers */}
      <style>
        {`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          @media (max-width: 640px) {
            .hide-scrollbar {
              padding-bottom: 8px !important;
            }
          }
        `}
      </style>
    </div>
  );
}
