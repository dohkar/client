import { CATEGORIES_AVITO as CATEGORIES } from "@/constants/categories";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Categories() {
  return (
    <section className='mb-2 ml-4 sm:ml-2 w-full'>
      <h2 className='text-muted-foreground font-semibold mb-1'>Категории</h2>

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
        className={cn(
          "flex gap-3 sm:gap-4",
          "overflow-x-auto",
          "-mx-4 px-4",
          "snap-x snap-mandatory",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "scrollbar-hide scroll-smooth touch-pan-x"
        )}
        style={{ touchAction: "pan-x" }}
      >
        {CATEGORIES.map(({ label, href, src }) => (
          <Link
            key={href}
            href={href}
            role='listitem'
            aria-label={label}
            className={cn(
              "flex flex-col items-center shrink-0",
              "w-[100px] sm:w-[120px]",
              "snap-start"
            )}
          >
            <div
              className={cn(
                "w-full bg-secondary h-14 sm:h-16 overflow-hidden rounded-xl relative"
              )}
            >
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
            <article>
              <p
                className={cn(
                  "line-clamp-3",
                  "text-sm text-center",
                  "wrap-break-word",
                  "text-foreground font-medium"
                )}
              >
                {label}
              </p>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
