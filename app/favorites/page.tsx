"use client";

import { PropertyCard } from "@/components/features/property-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Heart, Trash2, Search, SlidersHorizontal, X } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import { useRemoveFavoriteWithUndo } from "@/hooks/use-undo-delete";
import { RecommendationsBlock } from "@/components/recommendations/RecommendationsBlock";
import { useAuthStore } from "@/stores";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { ROUTES } from "@/constants";
import type { PropertyType } from "@/types/property";

type SortOption = "date" | "price-asc" | "price-desc" | "area-asc" | "area-desc";

export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated, isInitialized, isLoading: authLoading } = useAuthStore();

  // Используем optimistic хуки с Undo
  const { favorites: data, isLoading } = useFavorites();
  const { removeWithUndo, isRemoving } = useRemoveFavoriteWithUndo();

  // Фильтры и сортировка
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<PropertyType | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.replace(ROUTES.login);
    }
  }, [isAuthenticated, isInitialized, router]);

  // Фильтрованные и отсортированные данные
  const filteredData = useMemo(() => {
    if (!data) return [];

    let result = [...data];

    // Поиск по названию и адресу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(query) ||
          p.location?.toLowerCase().includes(query)
      );
    }

    // Фильтр по типу
    if (typeFilter !== "all") {
      result = result.filter((p) => p.type === typeFilter);
    }

    // Сортировка
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case "price-desc":
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case "area-asc":
        result.sort((a, b) => (a.area || 0) - (b.area || 0));
        break;
      case "area-desc":
        result.sort((a, b) => (b.area || 0) - (a.area || 0));
        break;
      case "date":
      default:
        // По дате публикации (новые первые)
        result.sort((a, b) => {
          const dateA = a.datePosted ? new Date(a.datePosted).getTime() : 0;
          const dateB = b.datePosted ? new Date(b.datePosted).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }

    return result;
  }, [data, searchQuery, typeFilter, sortBy]);

  const hasActiveFilters = searchQuery.trim() || typeFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setSortBy("date");
  };

  // Показываем фулл-скрин загрузку пока не инициализировались
  if (!isInitialized || authLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='flex flex-col items-center justify-center gap-3'>
          <span className='inline-block w-6 h-6 border-4 border-primary border-t-transparent border-solid rounded-full animate-spin' />
          <p className='text-muted-foreground text-base'>Загрузка...</p>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован, ничего не показываем (или перенаправит useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // Скелетоны при загрузке
  if (isLoading) {
    return (
      <div className='min-h-[70vh] py-8 sm:py-14'>
        <div className='container mx-auto px-2 md:px-4'>
          <div className='max-w-3xl mx-auto mb-8 sm:mb-12 text-center'>
            <h1 className='text-3xl sm:text-4xl font-bold mb-2 text-foreground'>
              Избранное
            </h1>
          </div>
          <div className='flex flex-col gap-6 max-w-4xl mx-auto'>
            {/* Фильтры */}
            <div className='flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-end pb-4'>
              <div className='flex-1'>
                <div className='h-10 bg-muted rounded-md w-full animate-pulse' />
              </div>
              <div className='w-40'>
                <div className='h-10 bg-muted rounded-md w-full animate-pulse' />
              </div>
              <div className='w-40'>
                <div className='h-10 bg-muted rounded-md w-full animate-pulse' />
              </div>
            </div>
          </div>
          <div className='mx-auto max-w-7xl mt-2'>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 xl:gap-10'>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className='rounded-xl bg-card border border-card/50 shadow-sm overflow-hidden flex flex-col animate-pulse'
                >
                  <div className='w-full aspect-4/3 bg-muted' />
                  <div className='p-4 flex-1 flex flex-col gap-2'>
                    <div className='h-6 w-2/3 bg-muted rounded mb-2' />
                    <div className='h-4 w-1/3 bg-muted rounded mb-2' />
                    <div className='h-4 w-1/2 bg-muted rounded' />
                    <div className='mt-4 h-9 w-full bg-muted rounded' />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Если избранное пустое
  if (!data.length) {
    return (
      <div className='container mx-auto px-4 py-8 sm:py-20 min-h-[70vh] flex flex-col justify-center'>
        <div className='max-w-xl mx-auto text-center'>
          <Card className='border-primary/20 shadow-md bg-card'>
            <CardContent className='p-6 sm:p-12 flex flex-col items-center justify-center'>
              <Heart className='w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 text-muted-foreground' />
              <h2 className='text-2xl sm:text-3xl font-bold mb-2'>Избранное пусто</h2>
              <p className='text-base sm:text-lg text-muted-foreground mb-8'>
                Добавьте понравившиеся объявления в избранное,&nbsp;чтобы быстро найти их
                позже.
              </p>
              <Button
                onClick={() => router.push(ROUTES.search)}
                className='btn-caucasus min-h-[48px] font-semibold w-full max-w-xs'
                size='lg'
              >
                Найти недвижимость
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Количество объявлений — более корректное склонение
  const declOfNum = (n: number, forms: [string, string, string]) => {
    return forms[
      n % 10 === 1 && n % 100 !== 11
        ? 0
        : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)
          ? 1
          : 2
    ];
  };

  return (
    <div className='min-h-[70vh] py-8 sm:py-14'>
      <div className='container mx-auto px-2 md:px-4'>
        <div className='max-w-3xl mx-auto mb-6 sm:mb-8 text-center'>
          <h1 className='text-3xl sm:text-4xl font-bold mb-2 text-foreground'>
            Избранное
          </h1>
          <p className='text-base sm:text-lg text-muted-foreground'>
            {data.length}{" "}
            {declOfNum(data.length, ["объявление", "объявления", "объявлений"])}{" "}
            в&nbsp;избранном
          </p>
        </div>

        {/* Панель поиска и фильтров */}
        <div className='mx-auto max-w-7xl mb-6'>
          <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
            {/* Поиск */}
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
              <Input
                type='text'
                placeholder='Поиск по названию или адресу...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='px-10 min-h-[44px]'
              />
              {searchQuery && (
                <Button
                  variant='clear'
                  onClick={() => setSearchQuery("")}
                  className='has-[>svg]:px-2 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                  aria-label='Очистить поиск'
                >
                  <X className='size-5' />
                </Button>
              )}
            </div>

            {/* Кнопка фильтров (мобилка) */}
            <Button
              variant='outline'
              onClick={() => setShowFilters(!showFilters)}
              className='sm:hidden min-h-[44px]'
            >
              <SlidersHorizontal className='w-4 h-4 mr-2' />
              Фильтры
              {hasActiveFilters && (
                <span className='ml-2 w-2 h-2 rounded-full bg-primary' />
              )}
            </Button>

            {/* Фильтры (десктоп) */}
            <div className='hidden sm:flex gap-3'>
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as PropertyType | "all")}
              >
                <SelectTrigger className='w-[160px] min-h-[44px]'>
                  <SelectValue placeholder='Тип' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Все типы</SelectItem>
                  <SelectItem value='apartment'>Квартиры</SelectItem>
                  <SelectItem value='house'>Дома</SelectItem>
                  <SelectItem value='land'>Участки</SelectItem>
                  <SelectItem value='commercial'>Коммерция</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className='w-[180px] min-h-[44px]'>
                  <SelectValue placeholder='Сортировка' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='date'>По дате</SelectItem>
                  <SelectItem value='price-asc'>Цена: по возрастанию</SelectItem>
                  <SelectItem value='price-desc'>Цена: по убыванию</SelectItem>
                  <SelectItem value='area-asc'>Площадь: по возрастанию</SelectItem>
                  <SelectItem value='area-desc'>Площадь: по убыванию</SelectItem>
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button variant='ghost' onClick={clearFilters} className='min-h-[44px]'>
                  <X className='w-4 h-4 mr-1' />
                  Сбросить
                </Button>
              )}
            </div>
          </div>

          {/* Мобильные фильтры (выдвижная панель) */}
          {showFilters && (
            <div className='sm:hidden mt-4 p-4 bg-card rounded-lg border border-border space-y-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Тип недвижимости</label>
                <Select
                  value={typeFilter}
                  onValueChange={(v) => setTypeFilter(v as PropertyType | "all")}
                >
                  <SelectTrigger className='w-full min-h-[44px]'>
                    <SelectValue placeholder='Тип' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Все типы</SelectItem>
                    <SelectItem value='apartment'>Квартиры</SelectItem>
                    <SelectItem value='house'>Дома</SelectItem>
                    <SelectItem value='land'>Участки</SelectItem>
                    <SelectItem value='commercial'>Коммерция</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Сортировка</label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className='w-full min-h-[44px]'>
                    <SelectValue placeholder='Сортировка' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='date'>По дате</SelectItem>
                    <SelectItem value='price-asc'>Цена: по возрастанию</SelectItem>
                    <SelectItem value='price-desc'>Цена: по убыванию</SelectItem>
                    <SelectItem value='area-asc'>Площадь: по возрастанию</SelectItem>
                    <SelectItem value='area-desc'>Площадь: по убыванию</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='flex gap-2'>
                {hasActiveFilters && (
                  <Button
                    variant='outline'
                    onClick={clearFilters}
                    className='flex-1 min-h-[44px]'
                  >
                    Сбросить
                  </Button>
                )}
                <Button
                  onClick={() => setShowFilters(false)}
                  className='flex-1 min-h-[44px]'
                >
                  Применить
                </Button>
              </div>
            </div>
          )}

          {/* Информация о результатах фильтрации */}
          {hasActiveFilters && (
            <p className='text-sm text-muted-foreground mt-3'>
              Найдено: {filteredData.length}{" "}
              {declOfNum(filteredData.length, ["объявление", "объявления", "объявлений"])}
            </p>
          )}
        </div>

        {/* Пустое состояние после фильтрации */}
        {filteredData.length === 0 && data.length > 0 && (
          <div className='mx-auto max-w-xl text-center py-12'>
            <Search className='w-12 h-12 text-muted-foreground mx-auto mb-4' />
            <h3 className='text-lg font-semibold mb-2'>Ничего не найдено</h3>
            <p className='text-muted-foreground mb-4'>
              Попробуйте изменить параметры поиска или фильтры
            </p>
            <Button onClick={clearFilters} variant='outline'>
              Сбросить фильтры
            </Button>
          </div>
        )}

        <div className='mx-auto max-w-7xl'>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8 xl:gap-10'>
            {filteredData.map((property) => {
              const removing = isRemoving(property.id);
              return (
                <div
                  key={property.id}
                  className={`
                    relative group flex flex-col h-full
                    transition-all duration-300 ease-out
                    ${removing ? "opacity-50 scale-95 pointer-events-none" : ""}
                  `}
                  style={{ minHeight: 410 }}
                >
                  <PropertyCard property={property} hideFavoriteButton />
                  {/* Overlayed delete button for all devices, always visible on mobile, hover on desktop */}
                  <Button
                    variant='destructive'
                    size='icon'
                    className={`
                      absolute z-20 top-2.5 right-2.5
                      opacity-100 pointer-events-auto
                      group-hover:opacity-100 group-hover:pointer-events-auto
                      sm:opacity-0 sm:pointer-events-none sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto
                      transition-opacity
                      shadow-xl rounded-full
                      flex items-center justify-center
                      w-10 h-10
                      focus:outline-none focus:ring-2 focus:ring-primary/40
                    `}
                    onClick={() => removeWithUndo(property.id, property.title)}
                    disabled={removing}
                    aria-label='Удалить из избранного'
                    title='Удалить из избранного'
                    tabIndex={0}
                    aria-busy={removing}
                  >
                    {removing ? (
                      <span className='w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin' />
                    ) : (
                      <Trash2 className='w-5 h-5' />
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <RecommendationsBlock
          title='Похожие объявления'
          excludeIds={data?.map((f) => f.id) ?? []}
          limit={6}
        />
      </div>
    </div>
  );
}
