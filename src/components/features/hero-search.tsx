"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo, useRef, useEffect, useReducer, type FormEvent } from "react";
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
import { DEFAULT_SEARCH_CATEGORY } from "@/constants/defaults";
import {
  buildSearchUrl,
  categorySlugFromType,
  dealTypeSlugFromApi,
  REGION_MAP,
} from "@/lib/url/segments";
import { useUserRegion } from "@/hooks/use-user-region";
import { useDetectUserRegion } from "@/hooks/use-detect-user-region";
import { useDebounce } from "@/hooks/use-debounce";
import { useListingsTotalCount } from "@/hooks/use-listings";
import {
  buildHeroListingSearchParams,
  getHeroRegionNameForId,
  type HeroDealApiToken,
} from "@/lib/hero-listing-search-params";
import {
  ensureRegionCacheInitialized,
  getRegionIdByName,
} from "@/services/region.service";
import type { ListingCategory } from "@/types/listing";
import { Categories } from "./categories";
import { useSearchHistory } from "@/hooks/use-search-history";
import { formatPriceCompact, parsePriceDigits } from "@/lib/format-price";

/** Герой: таб (buy/rent/daily) → API-значение для объявлений (Продам / Сдам / Посуточно). */
const HERO_DEAL_TO_API: Record<DealType, HeroDealApiToken> = {
  buy: "SALE",
  rent: "RENT_OUT",
  daily: "DAILY",
};

function ruListingWord(n: number): string {
  const abs = Math.abs(Math.trunc(n)) % 100;
  const d = abs % 10;
  if (abs > 10 && abs < 20) return "объявлений";
  if (d === 1) return "объявление";
  if (d >= 2 && d <= 4) return "объявления";
  return "объявлений";
}

type PropertyTypeFilter = "all" | "apartment" | "house" | "land" | "commercial";

const INITIAL_STATE = {
  query: "",
  dealType: DEAL_TYPES[0]?.value ?? "buy",
  type: "all" as PropertyTypeFilter,
  roomsMin: null as number | null,
  priceMin: "",
  priceMax: "",
};

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
    return `От ${formatPriceCompact(min)} до ${formatPriceCompact(max)}`;
  if (min != null) return `От ${formatPriceCompact(min)}`;
  if (max != null) return `до ${formatPriceCompact(max)}`;
  return "Цена";
}

// ─── HOOK ────────────────────────────────────────────────────
function useHeroSearchFilters(userRegionSlug: string) {
  const [query, setQuery] = useState(INITIAL_STATE.query);
  const [dealType, setDealType] = useState<DealType>(INITIAL_STATE.dealType);
  const [type, setType] = useState<PropertyTypeFilter>(INITIAL_STATE.type);
  const [roomsMin, setRoomsMin] = useState<number | null>(INITIAL_STATE.roomsMin);
  // Храним сырые строки (только цифры, без пробелов)
  const [priceMin, setPriceMinRaw] = useState(INITIAL_STATE.priceMin);
  const [priceMax, setPriceMaxRaw] = useState(INITIAL_STATE.priceMax);

  const priceMinNum = parsePriceDigits(priceMin);
  const priceMaxNum = parsePriceDigits(priceMax);

  const hasValidMin = priceMinNum != null;
  const hasValidMax = priceMaxNum != null;
  const priceError = hasValidMin && hasValidMax && priceMinNum! > priceMaxNum!;

  const apiDeal = HERO_DEAL_TO_API[dealType] ?? "SALE";
  const dealSlug = dealTypeSlugFromApi(apiDeal);

  const { searchUrl } = useMemo(() => {
    const isPriceValid = !(hasValidMin && hasValidMax && priceMinNum! > priceMaxNum!);
    return {
      searchUrl: buildSearchUrl({
        region: userRegionSlug,
        category: type !== "all" ? categorySlugFromType(type) : DEFAULT_SEARCH_CATEGORY,
        dealType: dealSlug || undefined,
        params: {
          query: query.trim() || undefined,
          rooms: roomsMin ?? undefined,
          price_min: hasValidMin && isPriceValid ? priceMinNum! : undefined,
          price_max: hasValidMax && isPriceValid ? priceMaxNum! : undefined,
        },
      }),
    };
  }, [
    userRegionSlug,
    query,
    dealSlug,
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
    handleReset,
  };
}

// ─── COMPONENT ───────────────────────────────────────────────
export function HeroSearch() {
  const router = useRouter();
  useDetectUserRegion();
  const userRegion = useUserRegion();
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
    priceError,
    priceLabel,
    // isDirty,
    searchUrl,
    // handleReset,
  } = useHeroSearchFilters(userRegion);

  const priceMinNum = parsePriceDigits(priceMin);
  const priceMaxNum = parsePriceDigits(priceMax);

  const queryInputRef = useRef<HTMLInputElement>(null);
  const regionCacheInitRef = useRef(false);
  const [, bumpRegionCache] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    if (regionCacheInitRef.current) return;
    regionCacheInitRef.current = true;
    ensureRegionCacheInitialized()
      .then(() => bumpRegionCache())
      .catch(() => {});
  }, []);

  const debouncedQuery = useDebounce(query, 400);
  const debouncedRoomsMin = useDebounce(roomsMin, 400);
  const debouncedPriceMinNum = useDebounce(priceMinNum, 400);
  const debouncedPriceMaxNum = useDebounce(priceMaxNum, 400);

  const listingCategory = useMemo((): ListingCategory => "REAL_ESTATE", []);

  const regionNameForId = useMemo(() => getHeroRegionNameForId(userRegion), [userRegion]);
  const regionId = regionNameForId ? getRegionIdByName(regionNameForId) : undefined;

  const countParams = useMemo(() => {
    const isPriceValid = !(
      debouncedPriceMinNum != null &&
      debouncedPriceMaxNum != null &&
      debouncedPriceMinNum > debouncedPriceMaxNum
    );
    return buildHeroListingSearchParams({
      dealToken: HERO_DEAL_TO_API[dealType] ?? "SALE",
      query: debouncedQuery,
      propertyType: type,
      roomsMin: debouncedRoomsMin,
      priceMin:
        debouncedPriceMinNum != null && isPriceValid ? debouncedPriceMinNum : null,
      priceMax:
        debouncedPriceMaxNum != null && isPriceValid ? debouncedPriceMaxNum : null,
      listingCategory,
      regionId,
    });
  }, [
    dealType,
    debouncedQuery,
    type,
    debouncedRoomsMin,
    debouncedPriceMinNum,
    debouncedPriceMaxNum,
    listingCategory,
    regionId,
  ]);

  const { data: countData, isFetching: isCountFetching } = useListingsTotalCount(
    countParams,
    !priceError
  );
  const total = typeof countData?.total === "number" ? countData.total : undefined;

  const submitLabel = (() => {
    if (priceError) return "Показать объявления";
    if (isCountFetching && total === undefined) return "Показать объявления…";
    if (total === undefined) return "Показать объявления";
    return `Показать ${total.toLocaleString("ru-RU")} ${ruListingWord(total)}`;
  })();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() || type !== "all") {
      const regionEntry =
        typeof userRegion === "string"
          ? REGION_MAP[userRegion as keyof typeof REGION_MAP]
          : undefined;
      pushSearch({
        label:
          query.trim() ||
          (PROPERTY_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? "Поиск"),
        region: regionEntry?.label ?? "Все регионы",
        href: searchUrl,
      });
    }
    router.push(searchUrl);
  };

  const renderDivider = () => (
    <div className='hidden sm:block w-px h-7 sm:h-8 bg-border shrink-0' aria-hidden />
  );

  return (
    <section className='relative pt-10 sm:pt-14 md:pt-20' aria-label='Поиск недвижимости'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mx-auto flex flex-col items-center gap-3 sm:gap-4 md:gap-6'>
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
              className='h-9 sm:h-10 min-w-0 w-full sm:w-60 md:w-72 bg-card border-0 rounded-xl text-foreground text-sm sm:text-base font-medium shadow-sm hover:bg-muted'
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
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none select-none'>
                      от
                    </span>
                    <Input
                      value={priceMin}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, "");
                        setPriceMin(raw);
                      }}
                      placeholder=''
                      className='h-10 text-sm pl-9 pr-8'
                      inputMode='numeric'
                      autoComplete='off'
                      maxLength={15}
                      id='priceMin'
                      aria-label='Минимальная цена'
                    />
                    <span
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none select-none'
                      aria-hidden
                    >
                      ₽
                    </span>
                  </div>
                  <div className='flex-1 relative'>
                    <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none select-none'>
                      до
                    </span>
                    <Input
                      value={priceMax}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, "");
                        setPriceMax(raw);
                      }}
                      placeholder=''
                      className='h-10 text-sm pl-9 pr-8'
                      inputMode='numeric'
                      autoComplete='off'
                      maxLength={15}
                      id='priceMax'
                      aria-label='Максимальная цена'
                    />
                    <span
                      className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none select-none'
                      aria-hidden
                    >
                      ₽
                    </span>
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
              {submitLabel}
            </Button>
          </form>

          <Categories />
        </div>
      </div>
    </section>
  );
}
