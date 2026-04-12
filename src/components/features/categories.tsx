"use client";

import { useSyncExternalStore } from "react";
import { AvitoCategory, CATEGORIES_AVITO as CATEGORIES } from "@/constants/categories";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { cn } from "@/lib/utils";

function emptySubscribe(): () => void {
  return () => {};
}

export function Categories() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  return (
    <section
      className='w-full overflow-hidden ml-2 sm:ml-4'
      aria-label='Категории недвижимости'
    >
      <h2 className='text-muted-foreground font-semibold mb-2'>Категории</h2>

      {/*
        До гидрации — нативный flex-скролл без Swiper.
        После гидрации — Swiper с drag/momentum.
        Визуально идентично, схлопывания нет.
      */}
      {!mounted ? (
        <div
          className='
            flex gap-3 -mx-4 px-4
            overflow-x-auto
            [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
          '
          style={{ touchAction: "pan-x" }}
          aria-hidden
        >
          {CATEGORIES.map((category) => (
            <div key={category.id} className='shrink-0 w-[120px]'>
              <CategoryCard category={category} />
            </div>
          ))}
        </div>
      ) : (
        <div className='-mx-4'>
          <Swiper
            modules={[FreeMode, Mousewheel]}
            slidesPerView='auto'
            spaceBetween={12}
            freeMode={{ enabled: true, momentum: true, momentumRatio: 0.5 }}
            mousewheel={{ forceToAxis: true }}
            grabCursor={true}
            slidesOffsetBefore={16}
            slidesOffsetAfter={16}
            className='!overflow-visible'
          >
            {CATEGORIES.map((category) => (
              <SwiperSlide key={category.id} className='!h-auto !w-[120px]'>
                <CategoryCard category={category} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </section>
  );
}

// Вынесено чтобы не дублировать JSX карточки
// Вынесено чтобы не дублировать JSX карточки
function CategoryCard({ category }: { category: AvitoCategory }) {
  const { id, label, description, href, icon, meta } = category;

  return (
    <Link
      href={href}
      draggable={false}
      aria-label={description || label}
      title={description}
      data-analytics-id={meta.analyticsId}
      data-category-id={id}
      className='
        flex flex-col items-center gap-1.5
        select-none group
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-ring focus-visible:rounded-xl
      '
    >
      <div
        className='
          w-full h-[64px] sm:h-[72px]
          relative overflow-hidden rounded-xl bg-secondary
          group-hover:brightness-95 transition-all duration-150
          group-focus-visible:ring-2 group-focus-visible:ring-ring
        '
      >
        <Image
          src={icon.src.trim()}
          alt={icon.alt || label}
          sizes={icon.sizes || "(max-width: 768px) 108px, 216px"}
          fill
          draggable={false}
          className='object-cover'
          priority={false}
          loading='lazy'
          // Next.js автоматически сгенерирует srcSet на основе sizes
        />

        {/* Бейдж для новых/популярных категорий */}
        {meta.tags?.includes("new") && (
          <span className='absolute top-1 right-1 px-1.5 py-0.5 text-[10px] font-medium bg-primary text-primary-foreground rounded-md'>
            New
          </span>
        )}
      </div>

      <p
        className={cn(
          "line-clamp-2 text-sm text-center",
          "text-foreground font-medium leading-tight",
          "group-hover:text-primary transition-colors"
        )}
      >
        {label}
      </p>
    </Link>
  );
}
