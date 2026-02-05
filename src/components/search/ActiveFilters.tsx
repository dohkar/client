import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SearchFiltersDisplay } from "@/lib/search-params";
import {
  getTypeLabel,
  getRegionLabel,
  getPriceLabel,
  getRoomsLabel,
  getAreaLabel,
  getCityLabel,
} from "./FilterLabels";

interface ActiveFiltersProps {
  filters: SearchFiltersDisplay;
  activeFiltersCount: number;
  selectedCityName: string | null;
  localPriceMin: string;
  localPriceMax: string;
  onTypeReset: () => void;
  onPriceReset: () => void;
  onRegionReset: () => void;
  onCityReset: () => void;
  onRoomsReset: () => void;
  onAreaReset: () => void;
  onResetAll: () => void;
}

export function ActiveFilters({
  filters,
  activeFiltersCount,
  selectedCityName,
  onTypeReset,
  onPriceReset,
  onRegionReset,
  onCityReset,
  onRoomsReset,
  onAreaReset,
  onResetAll,
}: ActiveFiltersProps) {
  if (activeFiltersCount === 0) return null;

  return (
    <div className='flex flex-wrap items-center gap-2 my-3'>
      {filters.type !== "all" && (
        <Button variant='secondary' size='sm' className='h-7 gap-1' onClick={onTypeReset}>
          {getTypeLabel(filters.type)}
          <X className='w-3 h-3' />
        </Button>
      )}
      {(filters.priceMin || filters.priceMax) && (
        <Button
          variant='secondary'
          size='sm'
          className='h-7 gap-1'
          onClick={onPriceReset}
        >
          {getPriceLabel(filters)}
          <X className='w-3 h-3' />
        </Button>
      )}
      {filters.region !== "all" && (
        <Button
          variant='secondary'
          size='sm'
          className='h-7 gap-1'
          onClick={onRegionReset}
        >
          {getRegionLabel(filters.region)}
          <X className='w-3 h-3' />
        </Button>
      )}
      {filters.cityId && (
        <Button variant='secondary' size='sm' className='h-7 gap-1' onClick={onCityReset}>
          {getCityLabel(selectedCityName)}
          <X className='w-3 h-3' />
        </Button>
      )}
      {filters.roomsMin !== null && filters.roomsMin !== undefined && (
        <Button
          variant='secondary'
          size='sm'
          className='h-7 gap-1'
          onClick={onRoomsReset}
        >
          {getRoomsLabel(filters.roomsMin)}
          <X className='w-3 h-3' />
        </Button>
      )}
      {filters.areaMin !== null && filters.areaMin !== undefined && (
        <Button variant='secondary' size='sm' className='h-7 gap-1' onClick={onAreaReset}>
          {getAreaLabel(filters.areaMin)}
          <X className='w-3 h-3' />
        </Button>
      )}
      <Button
        variant='ghost'
        size='sm'
        className='h-7 text-muted-foreground'
        onClick={onResetAll}
      >
        Сбросить все
      </Button>
    </div>
  );
}
