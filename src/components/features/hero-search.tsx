"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useRef, type FormEvent } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { DealType } from "@/types/common";
import { DEAL_TYPES } from "@/constants/search";
import { PROPERTY_TYPE_OPTIONS, ROOMS_OPTIONS } from "@/lib/search-constants";
import { buildSearchParams } from "@/lib/search-params";
import { ROUTES } from "@/constants";
import type { SearchFiltersDisplay } from "@/lib/search-params";
import { Categories } from "./categories";
import { SearchHistorySection } from "@/components/features/search-history/search-history-section";
import { ViewHistorySection } from "@/components/features/view-history/view-history-section";
import { useSearchHistory } from "@/hooks/use-search-history";

// ─── DEAL TYPE MAP ────────────────────────────────────────────
const DEAL_TYPE_MAP: Record<DealType, { url: string; api: "buy" | "rent_in" | "daily" }> =
  {
    buy: { url: "buy", api: "buy" },
    rent: { url: "rent_in", api: "rent_in" },
    daily: { url: "daily", api: "daily" },
  };

type PropertyTypeFilter = "all" | "apartment" | "house" | "land" | "commercial";

const INITIAL_STATE = {
  query: "",
  dealType: DEAL_TYPES[0]?.value ?? "buy",
  type: "all" as PropertyTypeFilter,
  roomsMin: null as number | null,
  priceMin: "",
  priceMax: "",
};

// ─── PRICE UTILS ─────────────────────────────────────────────

/**
 * Парсит строку → число или null.
 * Принимает как "1 234 567", так и "1234567".
 */
function parsePrice(val: string): number | null {
  const digits = val.replace(/\s/g, "").replace(/\D/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return isNaN(n) || n < 0 ? null : n;
}

/**
 * Форматирует число для отображения в <input>:
 * 1234567 → "1 234 567"
 * Пробел — неразрывный пробел (\u00a0) чтобы браузер не переносил.
 */
function formatForInput(val: string): string {
  const n = parsePrice(val);
  if (n == null) return "";
  return n.toLocaleString("ru-RU"); // "1 234 567" с неразрывными пробелами
}

/**
 * Компактный формат для кнопки/лейбла фильтра (как в Авито):
 * 232323   → "232,3 тыс."
 * 2321323  → "2,3 млн"
 * 1500000000 → "1,5 млрд"
 * Меньше 10 000 → просто число
 */
function formatCompact(n: number): string {
  if (n >= 1_000_000_000) {
    return (
      (n / 1_000_000_000).toLocaleString("ru-RU", { maximumFractionDigits: 1 }) + " млрд"
    );
  }
  if (n >= 1_000_000) {
    return (n / 1_000_000).toLocaleString("ru-RU", { maximumFractionDigits: 1 }) + " млн";
  }
  if (n >= 1_000) {
    return (n / 1_000).toLocaleString("ru-RU", { maximumFractionDigits: 1 }) + " тыс.";
  }
  return n.toLocaleString("ru-RU");
}

/**
 * Полный формат для тегов-фильтров под строкой поиска:
 * 232323 → "232 323 ₽"
 */
// function formatFull(n: number): string {
//   return n.toLocaleString("ru-RU") + "\u00a0₽";
// }

/**
 * Лейбл кнопки "Цена" — компактный, как в Авито.
 * "От 232,3 тыс. до 2,3 млн"  |  "От 100 тыс."  |  "до 5 млн"  |  "Цена"
 */
function buildPriceLabel(
  min: number | null,
  max: number | null,
  hasError: boolean
): string {
  if (hasError) return "Цена";
  if (min != null && max != null)
    return `От ${formatCompact(min)} до ${formatCompact(max)}`;
  if (min != null) return `От ${formatCompact(min)}`;
  if (max != null) return `до ${formatCompact(max)}`;
  return "Цена";
}

// ─── HOOK ────────────────────────────────────────────────────
function useHeroSearchFilters() {
  const [query, setQuery] = useState(INITIAL_STATE.query);
  const [dealType, setDealType] = useState<DealType>(INITIAL_STATE.dealType);
  const [type, setType] = useState<PropertyTypeFilter>(INITIAL_STATE.type);
  const [roomsMin, setRoomsMin] = useState<number | null>(INITIAL_STATE.roomsMin);
  // Храним сырые строки (только цифры, без пробелов)
  const [priceMin, setPriceMinRaw] = useState(INITIAL_STATE.priceMin);
  const [priceMax, setPriceMaxRaw] = useState(INITIAL_STATE.priceMax);

  const priceMinNum = parsePrice(priceMin);
  const priceMaxNum = parsePrice(priceMax);

  const hasValidMin = priceMinNum != null;
  const hasValidMax = priceMaxNum != null;
  const priceError = hasValidMin && hasValidMax && priceMinNum! > priceMaxNum!;

  const dealTypeForUrl = DEAL_TYPE_MAP[dealType].url;
  const dealTypeForSearchParam = DEAL_TYPE_MAP[dealType].api;

  const { searchParamsObj, searchUrl } = useMemo(() => {
    const isPriceValid = !(hasValidMin && hasValidMax && priceMinNum! > priceMaxNum!);

    const obj: Partial<SearchFiltersDisplay> = {
      query: query.trim() || undefined,
      dealType: dealTypeForSearchParam.toUpperCase() as SearchFiltersDisplay["dealType"],
      type: type !== "all" ? type : undefined,
      roomsMin: roomsMin ?? undefined,
      priceMin: hasValidMin && isPriceValid ? priceMinNum! : undefined,
      priceMax: hasValidMax && isPriceValid ? priceMaxNum! : undefined,
    };

    const params = buildSearchParams(obj);
    const qs = params.toString();
    return {
      searchParamsObj: obj,
      searchUrl: qs ? `${ROUTES.search}?${qs}` : ROUTES.search,
    };
  }, [
    query,
    dealTypeForSearchParam,
    type,
    roomsMin,
    hasValidMin,
    hasValidMax,
    priceMinNum,
    priceMaxNum,
  ]);

  const priceLabel = buildPriceLabel(priceMinNum, priceMaxNum, priceError);

  const isDirty =
    !!query.trim() ||
    type !== INITIAL_STATE.type ||
    roomsMin !== INITIAL_STATE.roomsMin ||
    priceMin !== INITIAL_STATE.priceMin ||
    priceMax !== INITIAL_STATE.priceMax ||
    dealType !== INITIAL_STATE.dealType;

  const handleReset = () => {
    setQuery(INITIAL_STATE.query);
    setDealType(INITIAL_STATE.dealType);
    setType(INITIAL_STATE.type);
    setRoomsMin(INITIAL_STATE.roomsMin);
    setPriceMinRaw(INITIAL_STATE.priceMin);
    setPriceMaxRaw(INITIAL_STATE.priceMax);
  };

  return {
    query,
    dealType,
    type,
    roomsMin,
    priceMin,
    priceMax,
    setQuery,
    setDealType,
    setType,
    setRoomsMin,
    setPriceMin: setPriceMinRaw,
    setPriceMax: setPriceMaxRaw,
    priceMinNum,
    priceMaxNum,
    priceError,
    priceLabel,
    isDirty,
    searchUrl,
    dealTypeForUrl,
    handleReset,
    searchParamsObj,
  };
}

// ─── COMPONENT ───────────────────────────────────────────────
export function HeroSearch() {
  const router = useRouter();
  const { push: pushSearch } = useSearchHistory();
  const {
    query,
    dealType,
    type,
    roomsMin,
    priceMin,
    priceMax,
    setQuery,
    setDealType,
    setType,
    setRoomsMin,
    setPriceMin,
    setPriceMax,
    // priceMinNum,
    // priceMaxNum,
    priceError,
    priceLabel,
    // isDirty,
    searchUrl,
    // handleReset,
  } = useHeroSearchFilters();

  const queryInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() || type !== "all") {
      pushSearch({
        label:
          query.trim() ||
          (PROPERTY_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? "Поиск"),
        region: "Ингушетия",
        href: searchUrl,
      });
    }
    router.push(searchUrl);
  };

  const renderDivider = () => (
    <div className='hidden sm:block w-px h-7 sm:h-8 bg-border shrink-0' aria-hidden />
  );

  return (
    <section
      className='relative py-10 sm:py-14 md:py-20 bg-muted/70'
      aria-label='Поиск недвижимости'
    >
      <div className='container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='max-w-5xl mx-auto flex flex-col items-center gap-5 sm:gap-6 md:gap-8'>
          {/* Заголовок */}
          <h1 className='text-xl min-[480px]:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-center tracking-tight text-foreground leading-tight'>
            Покупайте и продавайте недвижимость
          </h1>

          {/* Табы */}
          <div className='flex flex-wrap justify-center gap-2 sm:gap-2.5'>
            {DEAL_TYPES.map(({ value, label }) => {
              const isActive = dealType === value;
              return (
                <Button
                  key={value}
                  type='button'
                  variant={isActive ? "default" : "secondary"}
                  onClick={() => setDealType(value)}
                  className='min-h-12 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-[14px] text-sm sm:text-base md:text-lg font-medium active:scale-100'
                  aria-pressed={isActive}
                >
                  {label}
                </Button>
              );
            })}
          </div>

          {/* Фильтр-бар */}
          <form
            className='flex flex-wrap items-center gap-1 sm:gap-2 w-full rounded-2xl p-2 sm:p-3 bg-secondary border border-border/60'
            role='search'
            onSubmit={handleSubmit}
            autoComplete='off'
          >
            {/* Город */}
            <Input
              ref={queryInputRef}
              type='search'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Город, район или улица'
              className='h-9 sm:h-10 min-w-0 w-full sm:w-46 md:w-60 bg-card border-0 rounded-xl text-foreground text-sm sm:text-base font-medium shadow-sm hover:bg-muted'
              aria-label='Поиск'
              spellCheck={false}
              autoComplete='off'
            />

            {renderDivider()}

            {/* Тип недвижимости */}
            <Select value={type} onValueChange={(v) => setType(v as PropertyTypeFilter)}>
              <SelectTrigger
                className='h-9 sm:h-10 min-w-0 w-full min-[350px]:w-auto min-[350px]:min-w-[100px] sm:min-w-[120px] md:min-w-[140px] bg-card border-0 rounded-xl text-foreground font-medium text-sm sm:text-base shadow-sm hover:bg-muted sm:w-[200px] flex-1 max-w-full'
                aria-label='Тип недвижимости'
              >
                <SelectValue placeholder='Тип недвижимости' />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPE_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className='text-sm sm:text-base'
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {renderDivider()}

            {/* Комнаты */}
            <Select
              value={roomsMin === null ? "all" : String(roomsMin)}
              onValueChange={(v) => setRoomsMin(v === "all" ? null : Number(v))}
            >
              <SelectTrigger
                className='h-9 sm:h-10 min-w-0 w-full min-[400px]:w-auto min-[400px]:min-w-[80px] sm:min-w-[100px] md:min-w-[120px] bg-card border-0 rounded-xl font-medium text-sm sm:text-base shadow-sm hover:bg-muted flex-1'
                aria-label='Количество комнат'
              >
                <SelectValue placeholder='Количество комнат' />
              </SelectTrigger>
              <SelectContent>
                {ROOMS_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className='text-sm sm:text-base'
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {renderDivider()}

            {/* Цена */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type='button'
                  variant='ghost'
                  className='h-9 sm:h-10 min-w-0 w-full sm:min-w-52 sm:max-w-64 justify-between px-3 sm:px-4 rounded-xl font-medium text-sm sm:text-md bg-card hover:bg-muted overflow-hidden'
                  aria-label={priceLabel}
                >
                  <span className='truncate'>{priceLabel}</span>
                  <ChevronDown className='ml-1 h-4 w-4 opacity-60 shrink-0' aria-hidden />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className='w-80 sm:w-90 sm:p-2 p-1'
                align='start'
                sideOffset={8}
              >
                <div className='flex gap-2'>
                  <div className='flex-1 relative'>
                    <Input
                      value={priceMin ? `От ${formatForInput(priceMin)} ₽` : ""}
                      onChange={(e) => {
                        // Убираем "От", "₽" и пробелы при вводе
                        const raw = e.target.value.replace(/[^\d]/g, "");
                        setPriceMin(raw);
                      }}
                      placeholder='От 100 000 ₽'
                      className='h-10 text-sm pl-2 pr-4'
                      inputMode='numeric'
                      autoComplete='off'
                      maxLength={20}
                      id='priceMin'
                      aria-label='Минимальная цена'
                    />
                  </div>
                  <div className='flex-1 relative'>
                    <Input
                      value={priceMax ? `До ${formatForInput(priceMax)} ₽` : ""}
                      onChange={(e) => {
                        // Убираем "До", "₽" и пробелы при вводе
                        const raw = e.target.value.replace(/[^\d]/g, "");
                        setPriceMax(raw);
                      }}
                      placeholder='До 10 000 000 ₽'
                      className='h-10 text-sm pl-2 pr-4'
                      inputMode='numeric'
                      autoComplete='off'
                      maxLength={20}
                      id='priceMax'
                      aria-label='Максимальная цена'
                    />
                  </div>
                </div>

                {priceError && (
                  <p className='text-xs text-destructive mt-2'>
                    Минимальная цена не может быть больше максимальной
                  </p>
                )}
              </PopoverContent>
            </Popover>

            {/* Показать объявления */}
            <Button
              type='submit'
              className='w-full flex-1 min-[400px]:w-auto ml-0 min-[400px]:ml-auto min-h-[44px] sm:min-h-10 h-9 sm:h-10 px-4 sm:px-5 rounded-xl text-sm sm:text-base font-semibold'
              disabled={priceError}
            >
              Показать объявления
            </Button>
          </form>

          <Categories />
          <SearchHistorySection />
          <ViewHistorySection />
        </div>
      </div>
    </section>
  );
}
