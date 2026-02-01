"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useSearchFilters } from "@/hooks/use-search-filters";
import { useCities } from "@/hooks/use-cities";
import { getRegionIdByName } from "@/services/region.service";
import { PROPERTY_TYPE_OPTIONS, REGION_OPTIONS } from "@/lib/search-constants";
import { CitySearchSelect } from "@/components/features/CitySearchSelect";

export function MobileFilterDrawer() {
  const { isFilterModalOpen, openFilterModal, closeFilterModal } = useUIStore();

  // Используем единый hook для управления фильтрами (updateFilters с replace: true)
  const {
    appliedFilters: filters,
    draftPriceMin: localPriceMin,
    draftPriceMax: localPriceMax,
    setDraftPriceMin: setLocalPriceMin,
    setDraftPriceMax: setLocalPriceMax,
    handleTypeChange,
    handleRegionChange,
    handleCityChange,
    handleRoomsChange,
    handleAreaMinChange,
    handlePriceMinBlur,
    handlePriceMaxBlur,
    handleResetAll,
    priceErrors,
    isPending,
  } = useSearchFilters();

  const regionId =
    filters.region !== "all" ? getRegionIdByName(filters.region) : undefined;
  const { data: cities = [] } = useCities(regionId ?? undefined);

  const activeFiltersCount = [
    filters.query?.trim(),
    filters.type !== "all",
    filters.priceMin != null,
    filters.priceMax != null,
    filters.roomsMin != null,
    filters.areaMin != null,
    filters.region !== "all",
    filters.cityId?.trim(),
  ].filter(Boolean).length;

  return (
    <>
      <Button
        variant="outline"
        className="md:hidden gap-2 shadow-sm hover:shadow-md transition-shadow"
        onClick={openFilterModal}
        aria-label="Открыть фильтры"
      >
        <Filter className="h-4 w-4" />
        <span>Фильтры</span>
        {(filters.query?.trim() ||
          filters.type !== "all" ||
          filters.priceMin ||
          filters.priceMax ||
          filters.roomsMin ||
          filters.areaMin ||
          filters.region !== "all") && (
          <span className="ml-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
        )}
      </Button>

      <Dialog
        open={isFilterModalOpen}
        onOpenChange={(open) => {
          if (open) {
            openFilterModal();
          } else {
            closeFilterModal();
          }
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Filter className="h-5 w-5 text-primary" />
              </div>
              Фильтры поиска
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Тип недвижимости */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Тип недвижимости
              </label>
              <Select value={filters.type} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите тип" />
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
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                Цена (₽)
              </label>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="От"
                    min="0"
                    value={localPriceMin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, "");
                      setLocalPriceMin(val);
                    }}
                    onBlur={handlePriceMinBlur}
                    className={`pl-9 ${priceErrors.priceMin ? "border-destructive" : ""}`}
                    autoComplete="off"
                    inputMode="numeric"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    от
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="До"
                    min="0"
                    value={localPriceMax}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^\d]/g, "");
                      setLocalPriceMax(val);
                    }}
                    onBlur={handlePriceMaxBlur}
                    className={`pl-9 ${priceErrors.priceMax ? "border-destructive" : ""}`}
                    autoComplete="off"
                    inputMode="numeric"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    до
                  </span>
                </div>
                {(priceErrors.priceMin || priceErrors.priceMax) && (
                  <div className="text-xs text-destructive space-y-1">
                    {priceErrors.priceMin && <p>{priceErrors.priceMin}</p>}
                    {priceErrors.priceMax && <p>{priceErrors.priceMax}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* Комнаты */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Комнат минимум
              </label>
              <div className="flex gap-2 flex-wrap">
                {["0", "1", "2", "3", "4+"].map((option) => {
                  const optionValue = option === "4+" ? 4 : Number(option);
                  const isSelected =
                    filters.roomsMin !== null &&
                    filters.roomsMin === optionValue;
                  return (
                    <Button
                      key={option}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleRoomsChange(optionValue)}
                      className="flex-1 min-w-[60px] min-h-[44px] transition-all hover:scale-105"
                    >
                      {option}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Площадь */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <Ruler className="w-4 h-4 text-muted-foreground" />
                Площадь (м²) минимум
              </label>
              <div className="relative">
                <Input
                  type="number"
                  placeholder="От"
                  min="0"
                  value={filters.areaMin ?? ""}
                  onChange={(e) =>
                    handleAreaMinChange(
                      e.target.value !== "" && !isNaN(Number(e.target.value))
                        ? Number(e.target.value)
                        : null
                    )
                  }
                  className="pl-9"
                  autoComplete="off"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  от
                </span>
              </div>
            </div>

            {/* Регион */}
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                Регион
              </label>
              <Select value={filters.region} onValueChange={handleRegionChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите регион" />
                </SelectTrigger>
                <SelectContent>
                  {REGION_OPTIONS.map((option) => (
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
                label="Город"
                value={filters.cityId ?? ""}
                onValueChange={(value) => handleCityChange(value || null)}
                cities={cities}
                placeholder={cities.length === 0 ? "Загрузка городов…" : "Все города"}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleResetAll}
              className="w-full sm:w-auto"
            >
              Сбросить
            </Button>
            <Button
              onClick={() => {
                handlePriceMinBlur();
                handlePriceMaxBlur();
                closeFilterModal();
              }}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {isPending ? "Применяем…" : "Применить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
