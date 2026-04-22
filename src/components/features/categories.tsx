import { AvitoCategory, CATEGORIES_AVITO as CATEGORIES } from "@/constants/categories";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Порядок для 2 рядов + горизонтальный скролл: колонка j = [j, j+3], как в сетке 3×2 (слева направо, сверху вниз). */
function categoriesForMobileScroll(
  categories: readonly AvitoCategory[]
): AvitoCategory[] {
  return [0, 1, 2].flatMap((j) => [categories[j], categories[j + 3]]);
}

export function Categories() {
  const mobileOrder = categoriesForMobileScroll(CATEGORIES);

  return (
    <section className='w-full min-w-0' aria-label='Категории недвижимости'>
      <h2 className='text-muted-foreground font-semibold mb-2 text-left w-full'>
        Категории
      </h2>

      <div className={cn("hidden lg:grid w-full min-w-0 gap-3", "grid-cols-6")}>
        {CATEGORIES.map((category) => (
          <div key={category.id} className='min-w-0'>
            <CategoryCardDesktop category={category} />
          </div>
        ))}
      </div>

      {/* Мобильный: 2 ряда, колонки влево-вправо скроллятся; ширина колонки ~42vw — видно чуть больше 2 карточек */}
      <div className='lg:hidden w-full min-w-0 overflow-x-auto overflow-y-visible overscroll-x-contain touch-pan-x [scrollbar-width:thin]'>
        <div
          className={cn(
            "grid w-max grid-flow-col grid-rows-2",
            "gap-x-2.5 gap-y-2 sm:gap-x-3 sm:gap-y-2.5"
          )}
        >
          {mobileOrder.map((category) => (
            <div
              key={`m-${category.id}`}
              className={cn(
                "w-[42vw] min-w-[148px] max-w-[200px]",
                "sm:min-w-[158px] sm:max-w-[210px]"
              )}
            >
              <CategoryCardMobileMosaic category={category} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCardDesktop({ category }: { category: AvitoCategory }) {
  const { id, label, description, href, icon, meta } = category;

  return (
    <Link
      href={href}
      draggable={false}
      aria-label={description || label}
      title={description}
      data-analytics-id={meta.analyticsId}
      data-category-id={id}
      className={cn(
        "flex flex-col items-center gap-1.5 min-w-0 select-none group",
        "focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-ring focus-visible:rounded-xl"
      )}
    >
      <div
        className={cn(
          "w-full relative overflow-hidden rounded-xl bg-secondary",
          "h-[64px] sm:h-[72px] lg:h-[76px]",
          "group-hover:brightness-95 group-focus-visible:ring-2 group-focus-visible:ring-ring"
        )}
      >
        <Image
          src={icon.src.trim()}
          alt={icon.alt || label}
          sizes={icon.sizes || "(max-width: 1024px) 30vw, 12vw"}
          fill
          draggable={false}
          className='object-cover'
          priority={false}
          loading='lazy'
        />

        {meta.tags?.includes("new") && (
          <span className='absolute top-0.5 right-0.5 px-1.5 py-px text-[10px] font-medium bg-primary text-primary-foreground rounded-md'>
            New
          </span>
        )}
      </div>

      <p
        className={cn(
          "line-clamp-2 text-center w-full min-w-0 text-xs sm:text-sm",
          "text-foreground font-medium leading-tight group-hover:text-primary"
        )}
      >
        {label}
      </p>
    </Link>
  );
}

function CategoryCardMobileMosaic({ category }: { category: AvitoCategory }) {
  const { id, label, description, href, icon, meta } = category;

  return (
    <Link
      href={href}
      draggable={false}
      aria-label={description || label}
      title={description}
      data-analytics-id={meta.analyticsId}
      data-category-id={id}
      className={cn(
        "relative flex h-[102px] sm:h-[112px] w-full select-none group overflow-hidden",
        "rounded-2xl border border-border/50 bg-card shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <p
        className={cn(
          "absolute top-2.5 left-2.5 z-10 max-w-[58%] text-left",
          "text-xs sm:text-[13px] font-semibold leading-snug line-clamp-3",
          "text-foreground group-hover:text-primary"
        )}
      >
        {label}
      </p>

      {meta.tags?.includes("new") && (
        <span className='absolute top-2 right-2 z-10 px-1.5 py-0.5 text-[9px] font-semibold bg-primary text-primary-foreground rounded-md'>
          New
        </span>
      )}

      <div className='absolute bottom-0 right-0 h-[78%] w-[58%] pointer-events-none'>
        <Image
          src={icon.src.trim()}
          alt=''
          sizes={icon.sizes || "(max-width: 1023px) 28vw, 12vw"}
          fill
          draggable={false}
          className='object-contain object-bottom-right'
          priority={false}
          loading='lazy'
        />
      </div>
    </Link>
  );
}
