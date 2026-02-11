"use client";

import { useState, useMemo, useRef } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  className?: string;
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
  className = "",
}: CitySearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => filterCities(cities, query), [cities, query]);
  const selectedCity = useMemo(() => cities.find((c) => c.id === value), [cities, value]);

  // Reset query only when the Popover opens, not in useEffect
  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className='text-base font-semibold flex items-center gap-2 mb-1'>
        <MapPin className='w-4 h-4 text-primary/80' />
        <span>{label}</span>
      </Label>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            role='combobox'
            disabled={disabled || cities.length === 0}
            aria-expanded={open}
            className={cn(
              "h-12 w-full flex items-center justify-between rounded-lg text-base font-normal px-4 transition-all border-2 focus:ring-2 focus:ring-primary focus:outline-none",
              open ? "border-primary" : "border-input",
              disabled ? "opacity-70 cursor-not-allowed" : ""
            )}
          >
            <span
              className={cn(
                "truncate flex-1 text-left",
                !selectedCity && "text-muted-foreground"
              )}
            >
              {selectedCity?.name ?? placeholder}
            </span>
            <ChevronDown
              className={cn(
                "ml-2 h-5 w-5 text-muted-foreground transition-transform",
                open && "rotate-180"
              )}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className='w-[360px] p-0 rounded-lg shadow-lg border-0'
          align='start'
        >
          <div className='p-3 border-b bg-muted'>
            <Input
              ref={inputRef}
              placeholder='🔎 Начните вводить город...'
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className='h-10 rounded-lg px-3 text-[15px] focus:ring-2 focus:ring-primary transition-all placeholder:text-muted-foreground'
            />
          </div>
          <div className='max-h-64 overflow-y-auto py-1 custom-scroll'>
            <button
              type='button'
              className={cn(
                "w-full flex items-center gap-2 px-4 py-2.5 text-left text-[15px] rounded-md transition font-medium",
                !value
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "hover:bg-accent hover:text-accent-foreground text-muted-foreground/80"
              )}
              onClick={() => {
                onValueChange("");
                setOpen(false);
              }}
            >
              <Check
                className={cn(
                  "h-4 w-4 shrink-0 transition-opacity",
                  !value ? "opacity-100 text-primary" : "opacity-0"
                )}
              />
              <span className='flex-1'>Не выбран</span>
            </button>
            {filtered.map((city) => {
              const isSelected = value === city.id;
              return (
                <button
                  key={city.id}
                  type='button'
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-2.5 text-left text-[15px] rounded-md transition font-medium",
                    isSelected
                      ? "bg-primary/95 text-white shadow-sm"
                      : "hover:bg-accent hover:text-accent-foreground text-foreground/90"
                  )}
                  style={
                    isSelected
                      ? {
                          boxShadow: "0 1px 6px 0 rgba(60,60,135,0.14)",
                          fontWeight: 600,
                        }
                      : undefined
                  }
                  onClick={() => {
                    onValueChange(city.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0 text-white transition-opacity",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className='flex-1'>{city.name}</span>
                </button>
              );
            })}
            {filtered.length === 0 && query.trim() && (
              <div className='py-8 text-center text-[15px] text-muted-foreground select-none'>
                🫥 <br />
                <span className='mt-2 block opacity-80'>Ничего не найдено</span>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      <style>
        {`
        .custom-scroll::-webkit-scrollbar {
          width: 7px;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: rgba(160,164,180,0.12);
          border-radius: 6px;
        }
        .custom-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(160,164,180,0.12) transparent;
        }
        `}
      </style>
    </div>
  );
}
