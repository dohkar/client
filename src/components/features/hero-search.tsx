"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { DealType } from "@/types/common";
import { POPULAR_CITIES, DEAL_TYPES } from "@/constants/search";
import { cn } from "@/lib/utils";

interface SearchForm {
  query: string;
  dealType: DealType;
}

const DEFAULT_DEAL_TYPE = DEAL_TYPES[0]?.value || "buy";

export function HeroSearch() {
  const router = useRouter();

  // Вынесем errors на будущее, но не форсим ошибку на UI
  const {
    register,
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<SearchForm>({
    defaultValues: {
      query: "",
      dealType: DEFAULT_DEAL_TYPE,
    },
  });

  const dealType = watch("dealType");

  // useMemo убираем — это вычисление простое и предсказуемое
  const validDealType = DEAL_TYPES.some((t) => t.value === dealType)
    ? dealType
    : DEFAULT_DEAL_TYPE;

  // Теперь performSearch принимает SearchForm (расширяемость)
  const performSearch = (params: SearchForm) => {
    const trimmedQuery = params.query.trim();
    if (!trimmedQuery) return;

    router.push(
      `/search?query=${encodeURIComponent(trimmedQuery)}&dealType=${params.dealType}`
    );
  };

  const onSubmit = handleSubmit((data) => {
    performSearch(data);
  });

  return (
    <div className='relative background-mountains py-16 md:py-24'>
      <div className='container mx-auto px-2 relative z-10 lg:px-4'>
        <div className='max-w-4xl mx-auto text-center space-y-8'>
          <h1 className='text-4xl md:text-5xl font-bold text-white tracking-tight'>
            Найдите свой идеальный дом на Кавказе
          </h1>

          {/* Search box */}
          <form
            onSubmit={onSubmit}
            className='bg-white/5 backdrop-blur-2xl border border-white/15 shadow-2xl rounded-2xl p-3 sm:p-6 lg:p-6 max-w-4xl mx-auto w-full'
          >
            <div className='flex flex-col md:flex-row gap-4 lg:gap-5 items-stretch md:items-center'>
              {/* Поиск */}
              <div className='relative flex-1 min-w-0'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300' />
                <Input
                  {...register("query", { required: true })}
                  placeholder='Город, район или улица'
                  className={cn(
                    "pl-12 h-14 text-base bg-white/10 border-white/25 text-white placeholder:text-gray-300 font-medium",
                    "focus:bg-white/15 focus:border-white/40 focus:ring-2 focus:ring-primary/50 focus:shadow-lg",
                    "rounded-xl transition-all duration-200 shadow-inner"
                  )}
                  autoComplete='off'
                  aria-label='Поисковый запрос'
                />
              </div>

              {/* Тип сделки */}
              <Select
                value={validDealType}
                onValueChange={(v: DealType) =>
                  setValue("dealType", v, { shouldDirty: true })
                }
              >
                <SelectTrigger className='h-14 w-full md:w-40 bg-white/10 border-white/25 text-white font-medium rounded-xl focus:ring-primary/50 transition-all duration-200 shadow-inner'>
                  <div className='flex items-center gap-2 flex-1'>
                    <SelectValue placeholder='Тип сделки' />
                  </div>
                </SelectTrigger>
                <SelectContent className='bg-gray-900/95 backdrop-blur-lg border-white/15 text-white'>
                  {DEAL_TYPES.map(({ value, label, icon: Icon }) => (
                    <SelectItem
                      key={value}
                      value={value}
                      className='focus:bg-primary/30 focus:text-white'
                    >
                      <div className='flex items-center gap-2'>
                        <Icon className='h-4 w-4 text-primary' />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Кнопка */}
              <Button
                type='submit'
                variant='default'
                size='lg'
                className={cn(
                  "h-14 px-8 font-semibold text-base md:text-lg tracking-wide",
                  "bg-primary hover:bg-primary/90 active:bg-primary/80",
                  "rounded-xl shadow-lg shadow-primary/40",
                  "transition-all duration-200 active:scale-[0.98] hover:shadow-xl hover:shadow-primary/50",
                  "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
                disabled={Boolean(errors.query)}
                aria-label='Начать поиск'
              >
                Найти
              </Button>
            </div>
          </form>

          {/* Popular cities */}
          <div className='flex justify-center'>
            <div
              className={cn(
                "flex gap-3 bg-black/30 backdrop-blur-lg rounded-2xl px-3 py-2 shadow-lg border border-white/10",
                "overflow-x-auto scroll-smooth snap-x snap-mandatory", // скролл + snap
                "scrollbar-hide", // скрыть скроллбар (добавь в tailwind config или css)
                "max-w-full" // не вылезает за экран
              )}
            >
              {POPULAR_CITIES.map((city) => (
                <button
                  key={city}
                  onClick={() => performSearch({ query: city, dealType: validDealType })}
                  className={cn(
                    "flex shrink-0 cursor-pointer items-center gap-2 px-5 py-2",
                    "bg-transparent border border-primary/40 rounded-2xl",
                    "hover:border-primary/80 hover:bg-primary/10",
                    "transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    "text-gold font-medium text-sm md:text-base",
                    "snap-start" // snap к началу кнопки
                  )}
                  style={{
                    boxShadow: "0 1.5px 0 0 oklch(0.75 0.15 65 / 0.3)",
                  }}
                >
                  <MapPin className='h-4 w-4 text-gold' />
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
