"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SlidersHorizontal, Building2, ArrowUpDown } from "lucide-react";
import { usePropertyStore } from "@/stores";
import { useUIStore } from "@/stores";
import { PROPERTY_TYPE_OPTIONS, SORT_OPTIONS } from "@/lib/search-constants";

export function PropertyFilters() {
  const { filters, updateFilters, resetFilters } = usePropertyStore();
  const { openFilterModal } = useUIStore();

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 bg-card p-4 sm:p-6 rounded-xl border shadow-sm">
      <div className="flex flex-wrap gap-2 w-full md:w-auto">
        <Select
          value={filters.type}
          onValueChange={(value) =>
            updateFilters({ type: value as typeof filters.type })
          }
        >
          <SelectTrigger className="w-[160px] sm:w-[180px]">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder="Тип жилья" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.sortBy}
          onValueChange={(value) =>
            updateFilters({ sortBy: value as typeof filters.sortBy })
          }
        >
          <SelectTrigger className="w-[160px] sm:w-[180px]">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
              <SelectValue placeholder="Сортировка" />
            </div>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 w-full md:w-auto">
        <Button
          variant="outline"
          className="flex-1 md:flex-none gap-2 shadow-sm hover:shadow-md transition-shadow"
          onClick={openFilterModal}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Фильтры</span>
        </Button>
        <Button
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={resetFilters}
        >
          Сбросить
        </Button>
      </div>
    </div>
  );
}
