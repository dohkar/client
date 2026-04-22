"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const END_EPS_PX = 3;

type CategoriesMobileScrollProps = {
  children: ReactNode;
};

/**
 * Горизонтальный скролл категорий: градиент справа только если есть переполнение и конец ещё не достигнут.
 */
export function CategoriesMobileScroll({ children }: CategoriesMobileScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showRightFade, setShowRightFade] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const syncFade = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const hasOverflow = scrollWidth > clientWidth + END_EPS_PX;
      const atEnd = scrollLeft + clientWidth >= scrollWidth - END_EPS_PX;
      setShowRightFade(hasOverflow && !atEnd);
    };

    const rafInitial = requestAnimationFrame(() => {
      syncFade();
    });

    const onScrollOrResize = () => {
      syncFade();
    };

    el.addEventListener("scroll", onScrollOrResize, { passive: true });

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(syncFade);
    });
    ro.observe(el);
    const inner = el.firstElementChild;
    if (inner) ro.observe(inner);

    window.addEventListener("resize", onScrollOrResize);

    return () => {
      cancelAnimationFrame(rafInitial);
      el.removeEventListener("scroll", onScrollOrResize);
      ro.disconnect();
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  return (
    <div className='lg:hidden relative w-full min-w-0'>
      <div
        ref={scrollRef}
        className={cn(
          "w-full min-w-0 overflow-x-auto overflow-y-visible overscroll-x-contain touch-pan-x",
          "[scrollbar-width:thin] scroll-pl-1 scroll-pr-3 sm:scroll-pr-4"
        )}
      >
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 z-10 w-9 sm:w-11",
          "bg-linear-to-l from-background to-transparent",
          "transition-opacity duration-150 motion-reduce:transition-none",
          showRightFade ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
