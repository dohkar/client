"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { listingsService } from "@/services/listings.service";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useAuthStore } from "@/stores";
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
import {
  Edit,
  Trash2,
  Eye,
  Plus,
  Search,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/format";
import { ROUTES, PAGINATION } from "@/constants";
import { useDeleteListingWithUndo } from "@/hooks/use-delete-listing-with-undo";
import { useMemo, useState, useEffect } from "react";
import type { PropertyType } from "@/types/property";
import type { Listing, ListingSearchParams } from "@/types/listing";

type SortOption = "date" | "price-asc" | "price-desc" | "area-asc" | "area-desc";

function ListingStatusBadge({ listing }: { listing: Listing }) {
  const rej = listing.rejectionReason;
  if (listing.moderationStatus === "DRAFT") {
    return (
      <Badge variant='secondary' className='text-xs'>
        Черновик
      </Badge>
    );
  }
  if (listing.moderationStatus === "PENDING") {
    return (
      <Badge variant='secondary' className='text-xs'>
        На модерации
      </Badge>
    );
  }
  if (listing.moderationStatus === "REJECTED") {
    return (
      <Badge variant='outline' className='text-xs' title={rej ?? undefined}>
        Отклонено{rej ? " — см. причину" : ""}
      </Badge>
    );
  }
  if (listing.status === "SOLD") {
    return (
      <Badge variant='outline' className='text-xs'>
        Продано
      </Badge>
    );
  }
  if (listing.status === "ARCHIVED") {
    return (
      <Badge variant='outline' className='text-xs'>
        Архив
      </Badge>
    );
  }
  return (
    <Badge variant='default' className='text-xs'>
      Активно
    </Badge>
  );
}

const CATEGORY_SHORT: Record<string, string> = {
  REAL_ESTATE: "Недвижимость",
};

function declOfNum(n: number, forms: [string, string, string]) {
  return forms[
    n % 10 === 1 && n % 100 !== 11
      ? 0
      : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)
        ? 1
        : 2
  ];
}

export default function ListingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<PropertyType | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("date");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const { deleteWithUndo, isDeleting } = useDeleteListingWithUndo();

  /** sortBy для API (включая area-asc | area-desc — поддерживается сервером) */
  const sortByApi = useMemo((): ListingSearchParams["sortBy"] => {
    if (sortBy === "date") return "date-desc";
    return sortBy;
  }, [sortBy]);

  const apiType =
    typeFilter === "all"
      ? undefined
      : (typeFilter.toUpperCase() as "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL");

  const listingQueryParams = useMemo(() => {
    const q = searchQuery.trim() || undefined;
    const base = {
      my: true as const,
      page,
      limit: PAGINATION.propertiesMaxLimit,
      sortBy: sortByApi,
      query: q,
    };
    if (typeFilter === "all") {
      return base;
    }
    return {
      ...base,
      category: "REAL_ESTATE" as const,
      propertyType: apiType,
    };
  }, [page, sortByApi, searchQuery, typeFilter, apiType]);

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.listings.list(listingQueryParams),
    queryFn: () => listingsService.getListings(listingQueryParams),
    enabled: !!user,
    placeholderData: keepPreviousData,
  });

  const data = response?.data ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;
  const filteredData = data;

  useEffect(() => {
    if (searchQuery.trim() || typeFilter !== "all" || sortBy !== "date") {
      queueMicrotask(() => {
        setPage(1);
      });
    }
  }, [searchQuery, typeFilter, sortBy]);

  const hasActiveFilters = searchQuery.trim() || typeFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("all");
    setSortBy("date");
  };

  if (isError) {
    return (
      <div className='min-h-[70vh] py-8 sm:py-14'>
        <div className='container mx-auto px-2 md:px-4'>
          <div className='max-w-md mx-auto text-center py-12'>
            <h2 className='text-xl font-semibold mb-2'>Не удалось загрузить список</h2>
            <p className='text-muted-foreground text-sm mb-4'>
              {error instanceof Error ? error.message : "Произошла ошибка"}
            </p>
            <Button onClick={() => refetch()} variant='outline'>
              Повторить
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='min-h-[70vh] py-8 sm:py-14'>
        <div className='container mx-auto px-2 md:px-4'>
          <div className='max-w-3xl mx-auto mb-8 sm:mb-12 text-center'>
            <h1 className='text-3xl sm:text-4xl font-bold mb-2 text-foreground'>
              Мои объявления
            </h1>
            <p className='text-base sm:text-lg text-muted-foreground'>Загрузка...</p>
          </div>
          <div className='mx-auto max-w-7xl space-y-6 sm:space-y-8'>
            {/* Скелетон панели фильтров и поиска */}
            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 animate-pulse'>
              <div className='w-full sm:w-80 h-11 bg-muted rounded-md' />
              <div className='w-32 h-11 bg-muted rounded-md hidden sm:block' />
              <div className='w-32 h-11 bg-muted rounded-md hidden sm:block' />
              <div className='w-32 h-11 bg-muted rounded-md hidden sm:block' />
              <div className='w-36 h-11 bg-muted rounded-md ml-auto' />
            </div>
            {/* Скелетоны карточек объявлений */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8'>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className='rounded-xl border border-card/50 bg-card p-0 shadow-sm animate-pulse flex flex-col'
                >
                  <div className='h-40 bg-muted rounded-t-xl' />
                  <div className='flex-1 flex flex-col gap-3 px-4 pt-4 pb-5'>
                    <div className='h-5 w-1/2 bg-muted rounded mb-1' />
                    <div className='h-4 w-1/3 bg-muted rounded mb-3' />
                    <div className='flex flex-wrap gap-2 mb-2'>
                      <div className='h-4 w-12 bg-muted rounded' />
                      <div className='h-4 w-16 bg-muted rounded' />
                    </div>
                    <div className='h-4 w-20 bg-muted rounded mb-2' />
                    <div className='mt-auto flex gap-2'>
                      <div className='h-9 w-20 bg-muted rounded' />
                      <div className='h-9 w-9 bg-muted rounded' />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-[70vh] py-6 sm:py-8 md:py-12'>
      <div className='container mx-auto px-2 md:px-4'>
        <div className='mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold mb-2'>Мои объявления</h1>
            <p className='text-sm sm:text-base text-muted-foreground'>
              {total} {declOfNum(total, ["объявление", "объявления", "объявлений"])}
            </p>
          </div>
          <Link href={ROUTES.sell}>
            <Button className='btn-caucasus min-h-[44px] w-full sm:w-auto'>
              <Plus className='w-4 h-4 mr-2' />
              Создать объявление
            </Button>
          </Link>
        </div>

        {/* Панель поиска и фильтров — только если есть объявления */}
        {data && data.length > 0 && (
          <div className='mx-auto max-w-7xl mb-6'>
            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4'>
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
                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as SortOption)}
                  >
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
            {hasActiveFilters && (
              <p className='text-sm text-muted-foreground mt-3'>
                Найдено: {total}{" "}
                {declOfNum(total, ["объявление", "объявления", "объявлений"])}
              </p>
            )}
          </div>
        )}

        {total === 0 && hasActiveFilters && (
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

        {total === 0 && !hasActiveFilters ? (
          <Card className='w-full max-w-2xl min-h-[280px] mx-auto border-primary/20 shadow-sm bg-card flex items-center justify-center'>
            <CardContent className='w-full flex flex-col items-center justify-center gap-6 py-16 sm:py-20 text-center'>
              <p className='text-lg sm:text-xl text-muted-foreground'>
                У вас пока нет объявлений
              </p>
              <Link href={ROUTES.sell}>
                <Button className='btn-caucasus min-h-[48px] px-8 text-lg'>
                  Создать первое объявление
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : filteredData.length > 0 ? (
          <div className='mx-auto max-w-7xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'>
            {filteredData.map((listing: Listing) => {
              const deleting = isDeleting(listing.id);
              return (
                <Card
                  key={listing.id}
                  className={`
                  border-primary/20 transition-all bg-card
                  ${
                    deleting
                      ? "opacity-50 scale-95 pointer-events-none"
                      : "hover:shadow-xl hover:-translate-y-1"
                  }
                `}
                >
                  <CardContent className='p-0'>
                    <div className='relative group'>
                      <img
                        src={listing.image}
                        alt={listing.title}
                        className='w-full h-48 object-cover rounded-t-xl'
                      />
                      <div className='absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity'>
                        <Button
                          size='sm'
                          variant='secondary'
                          onClick={() =>
                            router.push(ROUTES.listing(listing.id, listing.slug))
                          }
                          className='min-h-[36px] min-w-[36px] shadow-md'
                          aria-label='Просмотреть'
                        >
                          <Eye className='w-4 h-4' />
                        </Button>
                        <Button
                          size='sm'
                          variant='secondary'
                          onClick={() =>
                            router.push(`/dashboard/listings/${listing.id}/edit`)
                          }
                          className='min-h-[36px] min-w-[36px] shadow-md'
                          aria-label='Редактировать'
                        >
                          <Edit className='w-4 h-4' />
                        </Button>
                        <Button
                          size='sm'
                          variant='destructive'
                          onClick={() => deleteWithUndo(listing.id, listing.title)}
                          disabled={deleting}
                          className='min-h-[36px] min-w-[36px] shadow-md'
                          aria-label='Удалить'
                        >
                          {deleting ? (
                            <span className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
                          ) : (
                            <Trash2 className='w-4 h-4' />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className='p-4 sm:p-5'>
                      <div className='flex items-center gap-2 mb-2 flex-wrap'>
                        <ListingStatusBadge listing={listing} />
                        <Badge variant='outline' className='text-xs font-normal'>
                          {CATEGORY_SHORT[listing.category] ?? listing.category}
                        </Badge>
                      </div>
                      <h3 className='font-semibold mb-2 line-clamp-2 text-sm sm:text-base'>
                        {listing.title}
                      </h3>
                      <p className='text-xl sm:text-2xl font-bold text-primary mb-2'>
                        {listing.dealType === "BUY" && (listing.price ?? 0) === 0
                          ? "По договорённости"
                          : formatCurrency(listing.price ?? 0, listing.currency)}
                      </p>
                      <p className='text-xs sm:text-sm text-muted-foreground line-clamp-1'>
                        {listing.location}
                      </p>
                      <div className='flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-muted-foreground'>
                        <span>
                          Создано:{" "}
                          {formatDate(listing.createdAt, "ru-RU", { relative: true })}
                        </span>
                        <span>👁 {listing.views ?? 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : null}

        {totalPages > 1 && filteredData.length > 0 && (
          <div className='mt-8 flex flex-col sm:flex-row items-center justify-center gap-4'>
            <p className='text-sm text-muted-foreground'>
              Страница {page} из {totalPages}
            </p>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className='min-h-[40px]'
              >
                <ChevronLeft className='w-4 h-4 mr-1' />
                Назад
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className='min-h-[40px]'
              >
                Вперёд
                <ChevronRight className='w-4 h-4 ml-1' />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
