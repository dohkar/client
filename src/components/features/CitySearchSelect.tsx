"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { normalizeCitySearch } from "@/data/cities-chechnya-ingushetia";
import type { CityDto } from "@/types/property";

interface CitySearchSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  cities: CityDto[];
  disabled?: boolean;
  label?: string;
  placeholder?: string;
}

function filterCities(cities: CityDto[], query: string): CityDto[] {
  if (!query.trim()) return cities;
  const q = normalizeCitySearch(query);
  return cities.filter((c) => normalizeCitySearch(c.name).includes(q));
}

export function CitySearchSelect({
  value,
  onValueChange,
  cities,
  disabled = false,
  label = "Город",
  placeholder = "Поиск или выбор города",
}: CitySearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => filterCities(cities, query), [cities, query]);

  const selectedCity = useMemo(
    () => cities.find((c) => c.id === value),
    [cities, value]
  );

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  return (
    <div className="space-y-2">
      <Label className="text-base font-medium flex items-center gap-2">
        <MapPin className="w-4 h-4 text-muted-foreground" />
        {label}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || cities.length === 0}
            className="h-11 w-full justify-between text-base font-normal"
          >
            <span
              className={cn(
                "truncate",
                !selectedCity && "text-muted-foreground"
              )}
            >
              {selectedCity?.name ?? placeholder}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <div className="p-2 border-b">
            <Input
              ref={inputRef}
              placeholder="Поиск города..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            <button
              type="button"
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                !value && "bg-accent"
              )}
              onClick={() => {
                onValueChange("");
                setOpen(false);
              }}
            >
              <Check className={cn("h-4 w-4 shrink-0", !value ? "opacity-100" : "opacity-0")} />
              Не выбран
            </button>
            {filtered.map((city) => {
              const isSelected = value === city.id;
              return (
                <button
                  key={city.id}
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent"
                  )}
                  onClick={() => {
                    onValueChange(city.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {city.name}
                </button>
              );
            })}
            {filtered.length === 0 && query.trim() && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Ничего не найдено
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
