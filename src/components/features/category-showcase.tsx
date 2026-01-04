"use client";

import Link from "next/link";
import { useMemo, useCallback } from "react";
import { RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoryStats } from "@/hooks/use-properties";
import { CATEGORIES, type CategoryConfig } from "@/constants/categories";

interface CategoryWithCount extends CategoryConfig {
  count: number;
}

interface CategoryStatEntry {
  type: string;
  count: number;
}

function formatNumber(num: number): string {
  if (num > 999_999) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + " млн";
  if (num > 9_999) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + " тыс";
  return num.toLocaleString("ru-RU");
}

interface ErrorBlockProps {
  onRetry: () => void;
  isRefetching: boolean;
}

function ErrorBlock({ onRetry, isRefetching }: ErrorBlockProps) {
  return (
    <div className='flex flex-col items-center justify-center py-12 text-muted-foreground gap-2'>
      <span>Не удалось загрузить категории</span>
      <button
        onClick={onRetry}
        className='inline-flex items-center px-3 py-1.5 mt-2 text-sm rounded bg-card border border-primary/30 hover:bg-primary/10 transition disabled:opacity-50 disabled:cursor-not-allowed'
        disabled={isRefetching}
        aria-busy={isRefetching}
        type='button'
      >
        {isRefetching ? (
          <Loader2 className='w-4 h-4 mr-2 animate-spin' />
        ) : (
          <RefreshCw className='w-4 h-4 mr-2' />
        )}
        Повторить
      </button>
    </div>
  );
}

interface CategoryCardProps {
  category: CategoryWithCount;
  isMobile?: boolean;
}

function CategoryCard({ category, isMobile = false }: CategoryCardProps) {
  const Icon = category.icon;
  const descriptionId = `category-desc-${category.id}`;
  const nameId = `category-name-${category.id}`;

  return (
    <div className={`group ${isMobile ? "flex-shrink-0 w-[240px]" : ""}`}>
      <Link
        href={category.href}
        aria-label={`${category.name}, ${formatNumber(category.count)} объявлений`}
        aria-describedby={descriptionId}
        className='block h-full'
        draggable={false}
        prefetch={false}
      >
        <Card className='h-full bg-card/80 border-none shadow-none group-hover:shadow-lg group-hover:border-primary/30 group-hover:-translate-y-[2px] cursor-pointer transition-smooth'>
          <CardContent
            className={`${isMobile ? "p-2" : "p-5"} mx-4 flex flex-col h-full items-center justify-center text-center gap-2`}
          >
            <div
              className={`w-full flex items-center justify-center ${isMobile ? "gap-2" : "gap-4"}`}
            >
              <div
                className={`${
                  isMobile ? "w-10 h-10" : "w-12 h-12"
                } rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center mb-2 transition-transform group-hover:scale-110`}
              >
                <Icon className='w-6 h-6 text-primary' strokeWidth={2} />
              </div>
              {isMobile ? (
                <span
                  id={descriptionId}
                  className={`${
                    isMobile ? "text-sm" : "text-xs"
                  } text-muted-foreground group-hover:text-primary transition-colors leading-tight`}
                >
                  {category.description}
                </span>
              ) : (
                <div className='flex flex-col gap-4 items-center'>
                  <span
                    id={nameId}
                    className={`text-foreground font-medium group-hover:text-primary transition-colors leading-tight`}
                  >
                    {category.name}
                  </span>
                  <span
                    id={descriptionId}
                    className={`${
                      isMobile ? "text-sm" : "text-sm"
                    } text-muted-foreground group-hover:text-primary transition-colors leading-tight`}
                  >
                    {category.description}
                  </span>
                </div>
              )}
            </div>
            <div className='flex items-baseline gap-2'>
              <span className='text-xl font-bold text-gold/80'>
                {formatNumber(category.count)}
              </span>
              <span className='text-sm text-muted-foreground font-medium'>
                объявлений
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

function SkeletonLoader({ isMobile }: { isMobile: boolean }) {
  if (isMobile) {
    return (
      <div className='flex gap-3 overflow-x-auto pb-2 scrollbar-hide animate-pulse'>
        {Array.from({ length: CATEGORIES.length }).map((_, idx) => (
          <Skeleton
            key={`skeleton-${idx}`}
            className='w-[240px] h-[120px] rounded-xl flex-shrink-0'
          />
        ))}
      </div>
    );
  }

  return (
    <>
      {Array.from({ length: CATEGORIES.length }).map((_, idx) => (
        <Skeleton key={`skeleton-${idx}`} className='w-full h-[140px] rounded-xl' />
      ))}
    </>
  );
}

interface CategoryListProps {
  categories: CategoryWithCount[];
  isMobile: boolean;
}

function CategoryList({ categories, isMobile }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div
        className={`text-center py-12 text-muted-foreground ${isMobile ? "w-full" : "col-span-4"}`}
      >
        Нет категорий
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className='flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth touch-pan-x'>
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} isMobile />
        ))}
      </div>
    );
  }

  return (
    <>
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </>
  );
}

export function CategoryShowcase() {
  const { data, isLoading, error, refetch, isRefetching } = useCategoryStats();

  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  const categoriesWithStats = useMemo<CategoryWithCount[]>(() => {
    return CATEGORIES.map((config) => {
      const stat = data?.data?.find(
        (s: CategoryStatEntry) => s.type.toLowerCase() === config.id.toLowerCase()
      );
      return {
        ...config,
        count: stat?.count || 0,
      };
    });
  }, [data]);

  const sortedCategories = useMemo<CategoryWithCount[]>(() => {
    return [...categoriesWithStats].sort((a, b) => b.count - a.count);
  }, [categoriesWithStats]);

  return (
    <section
      className='py-10 sm:py-14 bg-muted/40'
      role='region'
      aria-labelledby='category-showcase-heading'
    >
      <div className='container mx-auto px-4'>
        <div className='max-w-2xl mx-auto text-center mb-8 sm:mb-10'>
          <h2
            id='category-showcase-heading'
            className='text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground tracking-tight'
          >
            Категории объявлений
          </h2>
        </div>

        {/* Mobile Carousel */}
        <div className='block sm:hidden relative'>
          {isLoading && <SkeletonLoader isMobile />}
          {error && !isLoading && (
            <ErrorBlock onRetry={handleRefetch} isRefetching={isRefetching} />
          )}
          {!isLoading && !error && (
            <CategoryList categories={sortedCategories} isMobile />
          )}
        </div>

        {/* Desktop Grid */}
        <div className='hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[140px]'>
          {isLoading && <SkeletonLoader isMobile={false} />}
          {!isLoading && <CategoryList categories={sortedCategories} isMobile={false} />}
        </div>
      </div>
    </section>
  );
}
