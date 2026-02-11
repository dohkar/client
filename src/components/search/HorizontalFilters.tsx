"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, ChevronDown, MapPin, Search } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { SearchFiltersDisplay } from "@/lib/search-params";
import {
  PROPERTY_TYPE_OPTIONS,
  REGION_OPTIONS,
  ROOMS_OPTIONS,
  SORT_OPTIONS,
  SEARCH_DEAL_TYPE_OPTIONS,
} from "@/lib/search-constants";
import {
  getTypeLabel,
  getRegionLabel,
  getPriceLabel,
  getRoomsLabel,
  getAreaLabel,
  getCityLabel,
  getDealTypeLabel,
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
  onDealTypeChange: (dealType: SearchFiltersDisplay["dealType"]) => void;
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
  onDealTypeChange,
}: HorizontalFiltersProps) {
  const selectedCityName = filters.cityId
    ? (cities.find((c) => c.id === filters.cityId)?.name ?? null)
    : null;
  const [locationPopoverOpen, setLocationPopoverOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState("");

  const filteredCities = useMemo(() => {
    const q = citySearchQuery.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.name.toLowerCase().includes(q));
  }, [cities, citySearchQuery]);

  const handleLocationPopoverOpenChange = (open: boolean) => {
    setLocationPopoverOpen(open);
    if (!open) setCitySearchQuery("");
  };

  const locationLabel =
    filters.region === "all"
      ? "Локация"
      : selectedCityName
        ? `${getRegionLabel(filters.region)} · ${selectedCityName}`
        : getRegionLabel(filters.region);

  const handleRegionSelect = (region: SearchFiltersDisplay["region"]) => {
    onRegionChange(region);
  };

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
        {/* Тип сделки */}
        <div className='w-[110px] min-w-0 shrink-0 sm:w-[130px]'>
          <Select
            value={filters.dealType === "all" ? "all" : filters.dealType}
            onValueChange={(v) => onDealTypeChange(v as SearchFiltersDisplay["dealType"])}
          >
            <SelectTrigger className='h-10 sm:h-11 px-3 text-xs sm:text-base w-full min-w-0 flex-shrink-0'>
              <SelectValue>{getDealTypeLabel(filters.dealType)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SEARCH_DEAL_TYPE_OPTIONS.map((option) => (
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

        {/* Локация: регион + город в одном поповере */}
        <div className='w-[140px] min-w-0 shrink-0 sm:w-[200px]'>
          <Popover
            open={locationPopoverOpen}
            onOpenChange={handleLocationPopoverOpenChange}
          >
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className='h-10 sm:h-11 px-3 w-full justify-between text-xs sm:text-base gap-1'
              >
                <MapPin className='w-3.5 h-3.5 shrink-0 opacity-70' />
                <span className='truncate'>{locationLabel}</span>
                <ChevronDown className='w-4 h-4 opacity-50 shrink-0' />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className='w-64 sm:w-72 p-0 overflow-hidden flex flex-col max-h-[min(70vh,400px)]'
              align='start'
              sideOffset={8}
            >
              <div className='p-2 border-b bg-muted/40'>
                <p className='text-xs font-medium text-muted-foreground px-2 py-1'>
                  Регион
                </p>
                <div className='flex flex-wrap gap-1'>
                  {REGION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type='button'
                      onClick={() =>
                        handleRegionSelect(option.value as SearchFiltersDisplay["region"])
                      }
                      className={cn(
                        "text-xs sm:text-sm py-1.5 px-2.5 rounded-md transition-colors",
                        filters.region === option.value
                          ? "bg-primary text-primary-foreground"
                          : "bg-background hover:bg-accent cursor-pointer"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              {filters.region !== "all" && (
                <div className='flex flex-col min-h-0 flex-1'>
                  <p className='text-xs font-medium text-muted-foreground px-3 pt-2 pb-1'>
                    Город
                  </p>
                  <div className='px-2 pb-2 shrink-0'>
                    <div className='relative'>
                      <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none' />
                      <Input
                        type='text'
                        placeholder='Поиск города...'
                        value={citySearchQuery}
                        onChange={(e) => setCitySearchQuery(e.target.value)}
                        className='h-8 pl-8 text-xs'
                        autoComplete='off'
                        aria-label='Поиск города'
                      />
                    </div>
                  </div>
                  <div className='overflow-y-auto flex-1 min-h-0 pb-2'>
                    <button
                      type='button'
                      className='w-full text-left text-xs sm:text-sm py-2 px-3 hover:bg-accent rounded-none'
                      onClick={() => {
                        onCityChange(null);
                        setLocationPopoverOpen(false);
                      }}
                    >
                      Все города
                    </button>
                    {filteredCities.map((city) => (
                      <button
                        key={city.id}
                        type='button'
                        className='w-full text-left text-xs sm:text-sm py-2 px-3 hover:bg-accent truncate'
                        onClick={() => {
                          onCityChange(city.id);
                          setLocationPopoverOpen(false);
                        }}
                      >
                        {city.name}
                      </button>
                    ))}
                    {cities.length > 0 && filteredCities.length === 0 && (
                      <div className='py-4 text-center text-xs text-muted-foreground'>
                        Ничего не найдено
                      </div>
                    )}
                    {cities.length === 0 && (
                      <div className='py-4 text-center text-xs text-muted-foreground'>
                        Нет городов
                      </div>
                    )}
                  </div>
                </div>
              )}
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
