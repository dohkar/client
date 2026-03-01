"use client";

import { useState, useEffect } from "react";
import { CATEGORIES_AVITO as CATEGORIES } from "@/constants/categories";
import Link from "next/link";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { cn } from "@/lib/utils";

export function Categories() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          {CATEGORIES.map(({ label, href, src }) => (
            <div key={href} className='shrink-0 w-[120px]'>
              <CategoryCard label={label} href={href} src={src} />
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
            {CATEGORIES.map(({ label, href, src }) => (
              <SwiperSlide key={href} className='!h-auto !w-[120px]'>
                <CategoryCard label={label} href={href} src={src} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </section>
  );
}

// Вынесено чтобы не дублировать JSX карточки
function CategoryCard({
  label,
  href,
  src,
}: {
  label: string;
  href: string;
  src: string;
}) {
  return (
    <Link
      href={href}
      draggable={false}
      aria-label={label}
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
      '
      >
        <Image
          src={src}
          alt={label}
          fill
          draggable={false}
          sizes='100px'
          className='object-cover'
          priority={false}
        />
      </div>
      <p
        className={cn(
          "line-clamp-3 text-sm text-center",
          "text-foreground font-medium leading-tight"
        )}
      >
        {label}
      </p>
    </Link>
  );
}
