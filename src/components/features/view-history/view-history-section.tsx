"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Heart } from "lucide-react";
import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { useViewHistory } from "@/hooks/use-view-history";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ViewHistoryItem } from "@/lib/history/view-history";

export function ViewHistorySection() {
  const { items, isReady, remove, clear } = useViewHistory();

  if (!isReady || items.length === 0) return null;

  return (
    <section className='w-full overflow-hidden' aria-label='Просмотренные объявления'>
      <div className='flex items-center justify-between mb-1'>
        <h2 className='text-base font-semibold text-muted-foreground'>Вы смотрели</h2>
        <Button
          variant='ghost'
          size='sm'
          onClick={clear}
          className='text-xs text-muted-foreground hover:text-foreground h-auto py-1 px-2'
        >
          Очистить
        </Button>
      </div>

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
            forceToAxis: true,
          }}
          grabCursor={true}
          slidesOffsetBefore={16}
          slidesOffsetAfter={16}
          className='!overflow-visible'
        >
          {items.map((item) => (
            <SwiperSlide key={item.id} style={{ width: 180 }} className='!h-auto'>
              <ViewHistoryCard item={item} onRemove={remove} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}

function ViewHistoryCard({
  item,
  onRemove,
}: {
  item: ViewHistoryItem;
  onRemove: (id: string) => void;
}) {
  const [liked, setLiked] = useState(false);

  return (
    <div className='relative group/item h-full'>
      <Link
        href={item.href}
        draggable={false}
        className='
          flex flex-col h-full rounded-xl overflow-hidden
          border border-border bg-card
          hover:shadow-md hover:-translate-y-0.5
          transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
          select-none
        '
      >
        {/* Фото */}
        <div className='relative w-full h-[120px] overflow-hidden bg-muted'>
          <Image
            src={item.imageUrl || "/placeholder.svg"}
            alt={item.title}
            fill
            draggable={false}
            sizes='180px'
            className='object-cover group-hover/item:scale-105 transition-transform duration-300'
          />

          {/* Избранное */}
          {/* <button
            type='button'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setLiked((v) => !v);
            }}
            aria-label={liked ? "Убрать из избранного" : "Добавить в избранное"}
            className='
              absolute top-2 right-2
              w-7 h-7 rounded-full
              flex items-center justify-center
              bg-background/80 backdrop-blur-sm shadow-sm
              transition-all duration-150 hover:scale-110
            '
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5 transition-colors",
                liked ? "fill-red-500 text-red-500" : "text-muted-foreground"
              )}
            />
          </button> */}
        </div>

        {/* Текст */}
        <div className='p-2.5 flex flex-col gap-0.5'>
          <p className='text-sm font-bold text-foreground leading-tight'>{item.price}</p>
          <p className='text-xs text-muted-foreground leading-tight line-clamp-2'>
            {item.title}
          </p>
          <p className='text-xs text-muted-foreground truncate'>{item.address}</p>
        </div>
      </Link>

      {/* Удалить из просмотренных */}
      <button
        type='button'
        onClick={(e) => {
          e.stopPropagation();
          onRemove(item.id);
        }}
        aria-label='Убрать из просмотренных'
        className='
          absolute top-2 right-2 z-10
          opacity-0 group-hover/item:opacity-100
          w-6 h-6 rounded-full
          flex items-center justify-center
          bg-background/80 backdrop-blur-sm
          text-muted-foreground hover:text-foreground
          shadow-sm transition-all duration-150 hover:scale-110
        '
      >
        <X className='h-3 w-3' />
      </button>
    </div>
  );
}
