import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { buttonVariants } from "@/components/ui/button";

/**
 * Haptic feedback для iOS устройств
 */
const triggerHaptic = (style: "light" | "medium" | "heavy" = "light") => {
  if (typeof window !== "undefined" && "vibrate" in navigator) {
    const patterns = { light: 10, medium: 20, heavy: 30 };
    navigator.vibrate(patterns[style]);
  }
};

/**
 * Hook для свайп-навигации
 */
function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
}: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}) {
  const touchStart = React.useRef<number | null>(null);
  const touchEnd = React.useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = () => {
    if (!touchStart.current || !touchEnd.current) return;

    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > threshold;
    const isRightSwipe = distance < -threshold;

    if (isLeftSwipe && onSwipeLeft) {
      triggerHaptic("light");
      onSwipeLeft();
    }
    if (isRightSwipe && onSwipeRight) {
      triggerHaptic("light");
      onSwipeRight();
    }
  };

  return { onTouchStart, onTouchMove, onTouchEnd };
}

/**
 * Основной контейнер пагинации
 */
function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role='navigation'
      aria-label='Навигация по страницам'
      data-slot='pagination'
      className={cn(
        "mx-auto flex w-full justify-center min-w-0",
        "sm:min-w-[280px]",
        className
      )}
      {...props}
    />
  );
}

type PaginationContentProps = {
  className?: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  /** Отключить автоскролл вверх при смене страницы (по умолчанию true) */
  scrollOnPageChange?: boolean;
  /** Общее количество элементов (для отображения "Показано 1-20 из 100") */
  totalItems?: number;
  /** Количество элементов на странице (для расчета диапазона) */
  itemsPerPage?: number;
  /** Показывать информацию о количестве элементов */
  showItemsInfo?: boolean;
  /** Показывать кнопку "Перейти к странице" на десктопе */
  showJumpButton?: boolean;
};

/**
 * Прогресс-бар для мобильной версии
 */
function PaginationProgressBar({ current, total }: { current: number; total: number }) {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div
      className='flex items-center gap-3 w-full px-1'
      role='region'
      aria-label='Прогресс по страницам'
    >
      <div
        role='progressbar'
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Страница ${current} из ${total}`}
        className='relative flex-1 h-2 bg-muted/50 rounded-full overflow-hidden'
      >
        <div
          className='absolute inset-y-0 left-0 bg-linear-to-r from-primary to-primary/80 rounded-full transition-all duration-500 ease-out motion-reduce:transition-none'
          style={{ width: `${progress}%` }}
        >
          <div className='absolute inset-0 bg-linear-to-r from-white/20 to-transparent animate-shimmer' />
        </div>
      </div>
      <span
        className='text-xs font-medium text-muted-foreground tabular-nums min-w-14 text-right'
        aria-hidden
      >
        {current} / {total}
      </span>
    </div>
  );
}

/**
 * Улучшенный Jump Sheet с быстрыми переходами
 */
function PaginationJumpSheet({
  show,
  onClose,
  onSubmit,
  totalPages,
  currentPage,
}: {
  show: boolean;
  onClose: () => void;
  onSubmit: (page: number) => void;
  totalPages: number;
  currentPage: number;
}) {
  const [value, setValue] = React.useState<number | "">(currentPage);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const sheetRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (show) {
      setValue(currentPage);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [show, currentPage]);

  const inputValue = value === "" ? "" : value;

  // Закрытие по Escape
  React.useEffect(() => {
    if (!show) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [show, onClose]);

  // Фокус внутри sheet (простой focus trap: фокус не уходит в backdrop)
  React.useEffect(() => {
    if (!show || !sheetRef.current) return;
    const el = sheetRef.current;
    const focusable =
      'button, [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableNodes = el.querySelectorAll<HTMLElement>(focusable);
    const first = focusableNodes[0];
    const last = focusableNodes[focusableNodes.length - 1];
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [show]);

  if (!show) return null;

  const quickJumps = [
    { label: "Начало", value: 1 },
    { label: "+10", value: Math.min(totalPages, currentPage + 10) },
    { label: "+50", value: Math.min(totalPages, currentPage + 50) },
    { label: "Конец", value: totalPages },
  ].filter((item) => item.value !== currentPage);

  const handleSubmit = (page: number) => {
    const validPage = Math.max(1, Math.min(totalPages, page));
    triggerHaptic("medium");
    setError(null);
    onClose();
    onSubmit(validPage);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const num = value === "" ? NaN : Number(value);
    if (Number.isNaN(num) || num < 1 || num > totalPages) {
      setError(`Введите число от 1 до ${totalPages}`);
      inputRef.current?.focus();
      return;
    }
    handleSubmit(Math.floor(num));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 sm:hidden'
        onClick={onClose}
        aria-hidden
      />

      {/* Sheet */}
      <div
        className='fixed inset-x-0 bottom-0 z-50 sm:hidden animate-in slide-in-from-bottom duration-300'
        role='dialog'
        aria-modal='true'
        aria-labelledby='jump-to-page-title'
        aria-describedby='jump-to-page-desc'
      >
        <div
          ref={sheetRef}
          className='bg-background/95 backdrop-blur-xl w-full rounded-t-3xl p-6 pb-8 shadow-2xl border-t border-border/50'
        >
          {/* Handle */}
          <div
            className='w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-6'
            aria-hidden
          />

          <form className='flex flex-col space-y-4' onSubmit={handleFormSubmit}>
            <div className='text-center'>
              <h3 id='jump-to-page-title' className='text-lg font-semibold mb-1'>
                Перейти к странице
              </h3>
              <p id='jump-to-page-desc' className='text-sm text-muted-foreground'>
                Введите номер от 1 до {totalPages}
              </p>
            </div>

            {/* Input */}
            <div className='relative'>
              <input
                id='jump-to-page'
                ref={inputRef}
                className={cn(
                  "w-full py-4 px-4 rounded-2xl border-2 text-center text-2xl font-semibold",
                  "focus:ring-4 focus:ring-primary/20 transition-all",
                  "bg-muted/30",
                  error
                    ? "border-destructive focus:border-destructive"
                    : "border-border focus:border-primary"
                )}
                type='number'
                inputMode='numeric'
                pattern='[0-9]*'
                min={1}
                max={totalPages}
                value={inputValue}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "") {
                    setValue("");
                    setError(null);
                    return;
                  }
                  const val = parseInt(raw, 10);
                  setValue(Number.isNaN(val) ? "" : val);
                  setError(null);
                }}
                aria-invalid={!!error}
                aria-describedby={error ? "jump-to-page-error" : undefined}
              />
              {error && (
                <p
                  id='jump-to-page-error'
                  className='text-destructive text-sm mt-1.5 text-center'
                  role='alert'
                >
                  {error}
                </p>
              )}
            </div>

            {/* Quick jumps */}
            {quickJumps.length > 0 && (
              <div className='space-y-2'>
                <p className='text-xs font-medium text-muted-foreground text-center'>
                  Быстрые переходы
                </p>
                <div className='grid grid-cols-4 gap-2'>
                  {quickJumps.map((jump) => (
                    <button
                      key={jump.label}
                      type='button'
                      onClick={() => handleSubmit(jump.value)}
                      className={cn(
                        "py-2.5 px-2 rounded-xl text-xs font-medium",
                        "bg-muted hover:bg-muted/80 active:scale-95 motion-reduce:active:scale-100",
                        "transition-all duration-150",
                        "border border-border/50"
                      )}
                    >
                      {jump.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className='flex gap-3 pt-2'>
              <button
                type='button'
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "flex-1 h-12 text-base rounded-xl"
                )}
                onClick={onClose}
              >
                Отмена
              </button>
              <button
                type='submit'
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "flex-1 h-12 text-base font-semibold rounded-xl",
                  "shadow-lg shadow-primary/30"
                )}
              >
                Перейти
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

/**
 * Страничная кнопка
 */
type PageButtonProps = {
  page: number;
  isActive?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  "aria-label"?: string;
  tabIndex?: number;
  className?: string;
  disabled?: boolean;
};

function PaginationPageButton({
  page,
  isActive = false,
  onClick,
  "aria-label": ariaLabel,
  tabIndex,
  className,
  disabled = false,
}: PageButtonProps) {
  return (
    <button
      type='button'
      aria-current={isActive ? "page" : undefined}
      data-slot='pagination-link'
      data-active={isActive}
      tabIndex={tabIndex ?? (isActive ? -1 : 0)}
      aria-label={ariaLabel}
      onClick={(e) => {
        triggerHaptic("light");
        onClick(e);
      }}
      disabled={disabled}
      className={cn(
        // Base
        "inline-flex items-center justify-center text-sm font-medium transition-all duration-200",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "min-w-0 relative overflow-hidden",

        // Size: 48x48 mobile (better touch target), 40x40 desktop
        "h-12 w-12 sm:h-10 sm:w-10 rounded-xl sm:rounded-lg",

        // Active state (motion-reduce убирает scale)
        isActive
          ? [
              "bg-primary text-primary-foreground font-bold",
              "shadow-lg shadow-primary/30 sm:shadow-md sm:shadow-primary/20",
              "scale-105 sm:scale-100 motion-reduce:scale-100",
              "before:absolute before:inset-0 before:bg-linear-to-br before:from-white/20 before:to-transparent",
            ]
          : [
              "text-foreground hover:text-foreground",
              "hover:bg-accent/80 active:bg-accent",
              "hover:scale-105 active:scale-95 sm:hover:scale-100 sm:active:scale-95 motion-reduce:scale-100 motion-reduce:active:scale-100",
            ],

        className
      )}
    >
      {page}
    </button>
  );
}

/**
 * Arrow button
 */
type ArrowButtonProps = {
  direction: "prev" | "next" | "first" | "last";
  disabled?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  showLabel?: boolean;
  className?: string;
};

function PaginationArrowButton({
  direction,
  disabled,
  onClick,
  showLabel = true,
  className,
}: ArrowButtonProps) {
  const config = {
    prev: {
      label: "Назад",
      icon: <ChevronLeftIcon className='w-5 h-5 shrink-0' />,
    },
    next: {
      label: "Далее",
      icon: <ChevronRightIcon className='w-5 h-5 shrink-0' />,
    },
    first: {
      label: "Первая",
      icon: <ChevronsLeftIcon className='w-5 h-5 shrink-0' />,
    },
    last: {
      label: "Последняя",
      icon: <ChevronsRightIcon className='w-5 h-5 shrink-0' />,
    },
  }[direction];

  const isBack = direction === "prev" || direction === "first";

  return (
    <button
      type='button'
      aria-label={`${config.label} страница`}
      data-slot='pagination-arrow'
      tabIndex={disabled ? -1 : 0}
      disabled={disabled}
      onClick={(e) => {
        if (!disabled) {
          triggerHaptic("light");
          onClick(e);
        }
      }}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:opacity-40 disabled:pointer-events-none",
        "min-w-0 rounded-xl sm:rounded-lg",

        // Size
        "h-12 px-4 sm:h-10 sm:px-3",

        // Hover states
        "hover:bg-accent/80 active:bg-accent hover:scale-105 active:scale-95",
        "sm:hover:scale-100 sm:active:scale-95 motion-reduce:scale-100 motion-reduce:active:scale-100",

        disabled && "cursor-not-allowed",
        className
      )}
    >
      {isBack && config.icon}
      {showLabel && <span className='text-sm hidden sm:inline'>{config.label}</span>}
      {!isBack && config.icon}
    </button>
  );
}

/**
 * Ellipsis
 */
function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot='pagination-ellipsis'
      className={cn(
        "flex items-center justify-center select-none pointer-events-none",
        "min-w-0 sm:min-w-[40px] h-12 sm:h-10",
        "text-muted-foreground",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon className='w-5 h-5' />
      <span className='sr-only'>Больше страниц</span>
    </span>
  );
}

/**
 * Skeleton для загрузки
 */
function PaginationSkeleton() {
  return (
    <div className='flex items-center gap-2 animate-pulse'>
      <div className='h-12 w-12 sm:h-10 sm:w-10 bg-muted/50 rounded-xl sm:rounded-lg' />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className='hidden sm:block h-10 w-10 bg-muted/50 rounded-lg' />
      ))}
      <div className='h-12 w-12 sm:h-10 sm:w-10 bg-muted/50 rounded-xl sm:rounded-lg' />
    </div>
  );
}

/**
 * Контент пагинации
 */
function PaginationContent({
  className,
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  scrollOnPageChange = true,
  totalItems,
  itemsPerPage = 12,
  showItemsInfo = true,
  showJumpButton = true,
}: PaginationContentProps) {
  const safePage = Number.isFinite(currentPage) && currentPage >= 1 ? currentPage : 1;
  const safeTotal = Number.isFinite(totalPages) && totalPages >= 1 ? totalPages : 1;

  const [showJump, setShowJump] = React.useState(false);

  // Вычисляем диапазон элементов для отображения
  const itemsRange = React.useMemo(() => {
    if (!totalItems || !itemsPerPage) return null;
    const start = (safePage - 1) * itemsPerPage + 1;
    const end = Math.min(safePage * itemsPerPage, totalItems);
    return { start, end, total: totalItems };
  }, [safePage, itemsPerPage, totalItems]);

  // Desktop logic: на больших экранах показываем больше страниц (до 6)
  const desktopButtons = React.useMemo(() => {
    if (safeTotal <= 7) {
      // Если страниц 7 или меньше, показываем все
      return Array.from({ length: safeTotal }, (_, i) => i + 1);
    }

    // Если текущая страница в первых 6, показываем 1, 2, 3, 4, 5, 6, ..., n
    if (safePage <= 6) {
      return [1, 2, 3, 4, 5, 6, -1, safeTotal];
    }

    // Если текущая страница близко к концу (в последних 5), показываем 1, ..., n-5, n-4, n-3, n-2, n-1, n
    if (safePage >= safeTotal - 4) {
      return [
        1,
        -1,
        safeTotal - 5,
        safeTotal - 4,
        safeTotal - 3,
        safeTotal - 2,
        safeTotal - 1,
        safeTotal,
      ];
    }

    // Иначе показываем 1, 2, 3, 4, ..., текущая-1, текущая, текущая+1, ..., n
    return [1, 2, 3, 4, -1, safePage - 1, safePage, safePage + 1, -2, safeTotal];
  }, [safePage, safeTotal]);

  // Mobile: показываем 1, 2, 3, 4, ..., n
  // На мобильных показываем меньше страниц для экономии места
  const mobileButtons = React.useMemo(() => {
    if (safeTotal <= 5) {
      // Если страниц 5 или меньше, показываем все
      return Array.from({ length: safeTotal }, (_, i) => i + 1);
    }

    // Если текущая страница в первых 3, показываем 1, 2, 3, ..., n
    if (safePage <= 3) {
      return [1, 2, 3, -1, safeTotal];
    }

    // Если текущая страница близко к концу (в последних 3), показываем 1, ..., n-3, n-2, n-1, n
    if (safePage >= safeTotal - 2) {
      return [1, -1, safeTotal - 3, safeTotal - 2, safeTotal - 1, safeTotal];
    }

    // Иначе показываем 1, 2, 3, 4, ..., текущая, ..., n
    return [1, 2, 3, 4, -1, safePage, -2, safeTotal];
  }, [safePage, safeTotal]);

  // Page change handler с опциональной плавной прокруткой
  const handlePageChange = React.useCallback(
    (page: number) => {
      if (page === safePage || page < 1 || page > safeTotal) return;

      onPageChange(page);

      if (scrollOnPageChange && typeof window !== "undefined") {
        const scrollOptions: ScrollToOptions = {
          top: 0,
          behavior: "smooth",
        };
        const scrollableParent = document.querySelector("[data-pagination-scroll]");
        if (scrollableParent) {
          scrollableParent.scrollTo(scrollOptions);
        } else {
          window.scrollTo(scrollOptions);
        }
      }
    },
    [safePage, safeTotal, onPageChange, scrollOnPageChange]
  );

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === "ArrowLeft" && safePage > 1) {
        e.preventDefault();
        handlePageChange(safePage - 1);
      } else if (e.key === "ArrowRight" && safePage < safeTotal) {
        e.preventDefault();
        handlePageChange(safePage + 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        handlePageChange(1);
      } else if (e.key === "End") {
        e.preventDefault();
        handlePageChange(safeTotal);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [safePage, safeTotal, handlePageChange]);

  // Swipe navigation для мобилки
  const swipeHandlers = useSwipeNavigation({
    onSwipeLeft: () => {
      if (safePage < safeTotal) handlePageChange(safePage + 1);
    },
    onSwipeRight: () => {
      if (safePage > 1) handlePageChange(safePage - 1);
    },
  });

  if (isLoading) {
    return <PaginationSkeleton />;
  }

  return (
    <div className='w-full space-y-4 sm:space-y-0 relative'>
      {/* Mobile progress bar */}
      {/* <div className='sm:hidden px-2'>
        <PaginationProgressBar current={safePage} total={safeTotal} />
      </div> */}

      {/* Информация о количестве элементов и текущей странице */}
      {showItemsInfo && (
        <div className='flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-muted-foreground'>
          {itemsRange && (
            <span className='hidden sm:inline tabular-nums'>
              Показано {itemsRange.start}–{itemsRange.end} из {itemsRange.total}
            </span>
          )}
          <span className='tabular-nums'>
            Страница {safePage} из {safeTotal}
          </span>
        </div>
      )}

      <ul
        data-slot='pagination-content'
        className={cn(
          "flex flex-row items-center justify-center gap-1.5 sm:gap-2",
          "select-none w-full",
          className
        )}
        {...swipeHandlers}
      >
        {/* Previous button */}
        <li>
          <PaginationArrowButton
            direction='prev'
            disabled={safePage <= 1}
            onClick={() => handlePageChange(safePage - 1)}
            showLabel={true}
          />
        </li>

        {/* Mobile buttons: < 1 2 3 4 ... n > */}
        <li className='flex sm:hidden gap-1.5 items-center'>
          {mobileButtons.map((n, i) =>
            n < 0 ? (
              <PaginationEllipsis key={`mobile-ellipsis-${i}`} />
            ) : (
              <PaginationPageButton
                key={`mobile-${n}`}
                page={n}
                isActive={n === safePage}
                onClick={() => handlePageChange(n)}
                aria-label={n === safePage ? `Текущая страница ${n}` : `Страница ${n}`}
              />
            )
          )}
        </li>

        {/* Desktop buttons: < Назад 1 2 3 4 ... n Далее > */}
        {desktopButtons.map((n, i) =>
          n < 0 ? (
            <li key={`ellipsis-${i}`} className='hidden sm:flex'>
              <PaginationEllipsis />
            </li>
          ) : (
            <li key={`page-${n}`} className='hidden sm:flex'>
              <PaginationPageButton
                page={n}
                isActive={n === safePage}
                onClick={() => handlePageChange(n)}
                aria-label={n === safePage ? `Текущая страница ${n}` : `Страница ${n}`}
              />
            </li>
          )
        )}

        {/* Next button */}
        <li>
          <PaginationArrowButton
            direction='next'
            disabled={safePage >= safeTotal}
            onClick={() => handlePageChange(safePage + 1)}
            showLabel={true}
          />
        </li>

        {/* Jump button (mobile only, для больших каталогов) */}
        {safeTotal > 10 && (
          <li className='sm:hidden ml-2'>
            <button
              type='button'
              onClick={() => setShowJump(true)}
              aria-label='Перейти к странице'
              className={cn(
                "inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-lg",
                "text-xs font-medium",
                "bg-muted/80 hover:bg-muted active:scale-95 motion-reduce:active:scale-100",
                "transition-all duration-150",
                "border border-border/50"
              )}
            >
              <MoreHorizontalIcon className='w-4 h-4' aria-hidden />
            </button>
          </li>
        )}

        {/* Jump button для десктопа */}
        {showJumpButton && safeTotal > 10 && (
          <li className='hidden sm:flex ml-2'>
            <button
              type='button'
              onClick={() => setShowJump(true)}
              aria-label='Перейти к странице'
              className={cn(
                "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg",
                "text-sm font-medium",
                "bg-muted/80 hover:bg-muted active:scale-95 motion-reduce:active:scale-100",
                "transition-all duration-150",
                "border border-border/50"
              )}
            >
              <MoreHorizontalIcon className='w-4 h-4' aria-hidden />
              <span className='hidden lg:inline'>Перейти</span>
            </button>
          </li>
        )}
      </ul>

      {/* Jump sheet */}
      <PaginationJumpSheet
        show={showJump}
        onClose={() => setShowJump(false)}
        onSubmit={handlePageChange}
        totalPages={safeTotal}
        currentPage={safePage}
      />

      {/* Индикатор загрузки */}
      {isLoading && (
        <div className='absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg z-10'>
          <div className='flex items-center gap-2 text-sm text-muted-foreground bg-card/90 px-4 py-2 rounded-lg border border-border shadow-sm'>
            <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
            <span>Загрузка...</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Item wrapper (для обратной совместимости)
 */
function PaginationItem(props: React.ComponentProps<"li">) {
  return <li data-slot='pagination-item' {...props} />;
}

export {
  Pagination,
  PaginationContent,
  PaginationPageButton,
  PaginationArrowButton,
  PaginationItem,
  PaginationEllipsis,
  PaginationSkeleton,
};
