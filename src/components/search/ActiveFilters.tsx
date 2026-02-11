import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SearchFiltersDisplay } from "@/lib/search-params";
import {
  getTypeLabel,
  getPriceLabel,
  getRoomsLabel,
  getAreaLabel,
  getLocationChipLabel,
  getDealTypeLabel,
  getFloorLabel,
} from "./FilterLabels";

interface ActiveFiltersProps {
  filters: SearchFiltersDisplay;
  activeFiltersCount: number;
  selectedCityName: string | null;
  onTypeReset: () => void;
  onPriceReset: () => void;
  /** Сброс локации (регион + город) — один чип вместо двух */
  onLocationReset: () => void;
  onRoomsReset: () => void;
  onAreaReset: () => void;
  onQueryReset: () => void;
  onDealTypeReset: () => void;
  onFloorReset: () => void;
  onResetAll: () => void;
}

const hasFloorFilter = (f: SearchFiltersDisplay) =>
  f.floorMin != null || f.floorMax != null || f.floorNotFirst === true;

export function ActiveFilters({
  filters,
  activeFiltersCount,
  selectedCityName,
  onTypeReset,
  onPriceReset,
  onLocationReset,
  onRoomsReset,
  onAreaReset,
  onQueryReset,
  onDealTypeReset,
  onFloorReset,
  onResetAll,
}: ActiveFiltersProps) {
  if (activeFiltersCount === 0) return null;

  return (
    <div className='flex flex-wrap items-center gap-2 my-3'>
      {filters.query?.trim() && (
        <Button variant='secondary' size='sm' className='h-7 gap-1' onClick={onQueryReset}>
          <span className='truncate max-w-[140px]' title={filters.query}>
            {filters.query.trim()}
          </span>
          <X className='w-3 h-3 shrink-0' />
        </Button>
      )}
      {filters.dealType && filters.dealType !== "all" && (
        <Button variant='secondary' size='sm' className='h-7 gap-1' onClick={onDealTypeReset}>
          {getDealTypeLabel(filters.dealType)}
          <X className='w-3 h-3' />
        </Button>
      )}
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
      {(filters.region !== "all" || filters.cityId) && (
        <Button
          variant='secondary'
          size='sm'
          className='h-7 gap-1'
          onClick={onLocationReset}
        >
          <span
            className='truncate max-w-[180px]'
            title={getLocationChipLabel(filters.region, selectedCityName)}
          >
            {getLocationChipLabel(filters.region, selectedCityName)}
          </span>
          <X className='w-3 h-3 shrink-0' />
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
      {hasFloorFilter(filters) && (
        <Button variant='secondary' size='sm' className='h-7 gap-1' onClick={onFloorReset}>
          {getFloorLabel(filters)}
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
