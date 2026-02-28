import { CATEGORIES_AVITO as CATEGORIES } from "@/constants/categories";
import Link from "next/link";
import Image from "next/image";

export function Categories() {
  return (
    <section className='mb-4 w-full'>
      <h2 className='text-base font-semibold mb-3'>Категории</h2>

      {/*
        Нативный горизонтальный скролл:
        - overflow-x-auto     → включает скролл
        - touchAction: pan-x  → говорит браузеру: этот контейнер скроллится горизонтально,
                                не передавай touch родителю (убирает конфликт с page-scroll)
        - -mx-4 px-4          → карточки у краёв экрана не обрезаются
        - scrollbar hidden     → убирает полосу скролла на десктопе
        - snap-x snap-mandatory → мягкие остановки на карточках
      */}
      <div
        role='list'
        aria-label='Категории недвижимости'
        className='
          flex gap-3 sm:gap-4
          overflow-x-auto
          -mx-4 px-4
          pb-2
          snap-x snap-mandatory
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
        '
        style={{ touchAction: "pan-x" }}
      >
        {CATEGORIES.map(({ label, href, src }) => (
          <Link
            key={href}
            href={href}
            role='listitem'
            aria-label={label}
            className='
              flex flex-col items-center shrink-0
              w-[120px] sm:w-[136px]
              rounded-xl border border-muted bg-card
              shadow-sm hover:shadow-md hover:bg-muted
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
              transition-shadow duration-150
              snap-start
            '
          >
            <div className='w-full h-14 sm:h-16 overflow-hidden rounded-t-xl relative'>
              <Image
                src={src}
                alt={label}
                fill
                draggable={false}
                sizes='(max-width: 640px) 120px, 136px'
                className='object-cover'
                priority={false}
              />
            </div>
            <p className='w-full px-2 py-2 text-[13px] sm:text-sm leading-tight text-center line-clamp-2'>
              {label}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
