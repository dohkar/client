"use client";

import { useMemo } from "react";
import Link from "next/link";
import { X, Search } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { useSearchHistory } from "@/hooks/use-search-history";
import { Button } from "@/components/ui/button";

export function SearchHistorySection() {
  const { items, isReady, remove, clear } = useSearchHistory();

  const hasItems = useMemo(() => isReady && items.length > 0, [isReady, items.length]);
  if (!hasItems) return null;

  return (
    <section
      className='w-full overflow-hidden ml-4 sm:ml-2 mb-1 sm:mb-2'
      aria-label='История поиска'
    >
      <div className='flex items-center justify-between mb-1'>
        <h2 className='text-base font-semibold text-muted-foreground'>Вы искали</h2>
        <Button
          variant='ghost'
          size='sm'
          onClick={clear}
          className='text-xs text-muted-foreground hover:text-foreground h-auto py-1 px-2'
        >
          Очистить
        </Button>
      </div>

      {/*
        -mx-4 px-4 — карточки у краёв не обрезаются
        grabCursor   — курсор-рука на десктопе
        freeMode     — инерционный скролл, не защёлкивается
        mousewheel   — скролл колёсиком мыши (горизонтально)
        slidesPerView: "auto" — карточки своей ширины, не растягиваются
      */}
      <div className='-mx-4'>
        <Swiper
          modules={[FreeMode, Mousewheel]}
          slidesPerView='auto'
          spaceBetween={12}
          freeMode={{
            enabled: true,
            momentum: true,
            momentumRatio: 0.6,
          }}
          mousewheel={{
            forceToAxis: true, // только горизонталь, не мешает вертикальному скроллу страницы
          }}
          grabCursor={true}
          slidesOffsetBefore={16} // px — отступ слева (= px-4)
          slidesOffsetAfter={16} // px — отступ справа
          className='!overflow-visible'
        >
          {items.map((item) => (
            <SwiperSlide key={item.id} className='!h-auto !w-[240px] !sm:w-[340px]'>
              <div className='relative group/item h-full'>
                <Link
                  href={item.href}
                  draggable={false} // не мешает drag Swiper'а
                  className='
                    flex items-center gap-3 px-4 py-3 h-full rounded-xl
                    bg-card border border-border
                    hover:border-primary/40 hover:shadow-sm
                    transition-all duration-150
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                    select-none
                  '
                >
                  <Search
                    className='h-4 w-4 text-muted-foreground shrink-0'
                    aria-hidden
                  />
                  <div className='min-w-0'>
                    <p className='text-sm font-medium text-foreground truncate'>
                      {item.label}
                    </p>
                    <p className='text-xs text-muted-foreground mt-0.5'>{item.region}</p>
                  </div>
                </Link>

                {/* Кнопка удаления */}
                <button
                  type='button'
                  onClick={(e) => {
                    e.preventDefault();
                    remove(item.id);
                  }}
                  aria-label={`Удалить "${item.label}" из истории`}
                  className='
                    absolute right-2 top-1/2 -translate-y-1/2
                    opacity-0 group-hover/item:opacity-100
                    w-6 h-6 rounded-full
                    flex items-center justify-center
                    text-muted-foreground hover:text-foreground
                    bg-background/80 hover:bg-muted
                    transition-all duration-150
                  '
                >
                  <X className='h-3 w-3' />
                </button>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
