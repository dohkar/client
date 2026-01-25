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
  const validDealType =
    DEAL_TYPES.some((t) => t.value === dealType)
      ? dealType
      : DEFAULT_DEAL_TYPE;

  // Теперь performSearch принимает SearchForm (расширяемость)
  const performSearch = (params: SearchForm) => {
    const trimmedQuery = params.query.trim();
    if (!trimmedQuery) return;

    router.push(
      `/search?query=${encodeURIComponent(trimmedQuery)}&dealType=${params.dealType}`,
    );
  };

  const onSubmit = handleSubmit((data) => {
    performSearch(data);
  });

  return (
    <div className='relative background-mountains py-16 md:py-24'>
      <div className='container mx-auto px-4 relative z-10'>
        <div className='max-w-3xl mx-auto text-center space-y-8'>
          <h1 className='text-4xl md:text-5xl font-bold text-white tracking-tight'>
            Найдите свой идеальный дом на Кавказе
          </h1>

          {/* Search box */}
          <form onSubmit={onSubmit} className='bg-white p-6 rounded-xl shadow-xl max-w-2xl mx-auto'>
            <div className='flex flex-col lg:flex-row gap-4'>
              {/* Input */}
              <div className='relative flex-1'>
                <Search className='absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground' />

                <Input
                  {...register("query", { required: true })}
                  placeholder='Город, район или улица'
                  className='pl-12 h-12 text-base'
                  autoComplete='off'
                  aria-label='Поисковый запрос'
                />
              </div>

              {/* Deal type */}
              <Select
                value={validDealType}
                onValueChange={(v: DealType) =>
                  setValue("dealType", v, { shouldDirty: true })
                }
              >
                <SelectTrigger className='h-12 text-base'>
                  <div className='flex items-center gap-2 flex-1'>
                    <SelectValue placeholder='Тип сделки' />
                  </div>
                </SelectTrigger>

                <SelectContent>
                  {DEAL_TYPES.map(({ value, label, icon: Icon }) => (
                    <SelectItem key={value} value={value}>
                      <div className='flex items-center gap-2'>
                        <Icon className='h-4 w-4 text-primary' />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search button */}
              <Button
                type='submit'
                className='h-12 px-8 font-semibold'
                aria-label='Начать поиск'
                disabled={Boolean(errors.query)} // простая блокировка если инпут пустой
              >
                Найти
              </Button>
            </div>
          </form>

          {/* Popular cities */}
          <div className='flex flex-wrap justify-center gap-2 pt-2 text-sm'>
            {POPULAR_CITIES.map((city) => (
              <button
                key={city}
                onClick={() =>
                  performSearch({ query: city, dealType: validDealType })
                }
                className='flex items-center gap-1 px-3 py-1.5 bg-primary/40 text-gold rounded-full border border-white/30 hover:border-white/60 hover:brightness-110 transition-all duration-200'
              >
                <MapPin className='h-3 w-3' />
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}