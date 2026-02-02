"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X as CloseIcon, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MediaItem } from "./types";
import { MediaThumbnail } from "./MediaThumbnail";
import { MediaSlide } from "./MediaSlide";

type MediaGridProps = {
  media: MediaItem[];
  initialIndex?: number;
  aspectRatio?: "16/9" | "4/3" | "1/1";
  className?: string;
  emptyStateText?: string;
};

export function MediaGrid({
  media,
  initialIndex = 0,
  aspectRatio = "16/9",
  className,
  emptyStateText = "Нет фото",
}: MediaGridProps) {
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.max(0, Math.min(initialIndex, Math.max(0, media.length - 1)))
  );
  const [zoom, setZoom] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasMore = media.length > 1;

  const mainSlideRef = useRef<HTMLDivElement | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const slideChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const SLIDE_CHANGE_DELAY_MS = 120;

  // Центрируем активную миниатюру на полоске при смене currentIndex
  useEffect(() => {
    if (!thumbsRef.current) return;
    const activeThumb = thumbsRef.current.children[currentIndex] as HTMLElement;
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentIndex]);

  // Плавная смена слайда: сначала fade (loading), через короткую задержку — смена индекса, затем появление нового слайда
  const scheduleSlideChange = useCallback((getNextIndex: (prev: number) => number) => {
    setZoom(1);
    setIsLoading(true);
    if (slideChangeTimeoutRef.current) clearTimeout(slideChangeTimeoutRef.current);
    slideChangeTimeoutRef.current = setTimeout(() => {
      setCurrentIndex(getNextIndex);
      slideChangeTimeoutRef.current = null;
    }, SLIDE_CHANGE_DELAY_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (slideChangeTimeoutRef.current) clearTimeout(slideChangeTimeoutRef.current);
    };
  }, []);

  const handlePrev = useCallback(() => {
    scheduleSlideChange((prev) => (prev > 0 ? prev - 1 : media.length - 1));
  }, [media.length, scheduleSlideChange]);
  const handleNext = useCallback(() => {
    scheduleSlideChange((prev) => (prev < media.length - 1 ? prev + 1 : 0));
  }, [media.length, scheduleSlideChange]);

  // Touch swipe (лево/право) на основном слайде
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
  };

  // Управление клавишами в полноэкранном режиме или при фокусе на галерее
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!fullscreen && document.activeElement !== mainSlideRef.current) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      }
      if ((e.key === "+" || e.key === "=") && zoom === 1) setZoom(2);
      if ((e.key === "-" || e.key === "_") && zoom === 2) setZoom(1);
      if (e.key === "Escape" && fullscreen) setFullscreen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoom, fullscreen, handlePrev, handleNext]);
  const handleThumbnailClick = useCallback(
    (index: number) => {
      scheduleSlideChange(() => index);
    },
    [scheduleSlideChange]
  );
  const handleToggleFullscreen = () => {
    setFullscreen((prev) => !prev);
    setZoom(1);
    // Фокус на главный слайд для ESC и стрелок
    setTimeout(() => {
      mainSlideRef.current?.focus();
    }, 200);
  };

  // Видео: play только у активного, у остальных pause (и сброс на начало)
  useEffect(() => {
    document
      .querySelectorAll<HTMLVideoElement>("video[data-gallery-vid]")
      .forEach((v, idx) => {
        if (idx === currentIndex) {
          v.play().catch(() => {});
        } else {
          v.pause();
          v.currentTime = 0;
        }
      });
  }, [currentIndex, fullscreen]);

  // "заглушка" при отсутствии фото/видео
  if (media.length === 0) {
    return (
      <div
        className={cn(
          "bg-muted rounded-2xl flex items-center justify-center aspect-video min-h-[220px] md:min-h-[320px] border border-dashed border-muted-foreground/30",
          className
        )}
      >
        <p className='text-muted-foreground text-base font-medium'>{emptyStateText}</p>
      </div>
    );
  }

  const containerAspect =
    aspectRatio === "16/9"
      ? "aspect-video"
      : aspectRatio === "4/3"
        ? "aspect-[4/3]"
        : "aspect-square";

  return (
    <div className={cn("space-y-3 md:space-y-4", className)}>
      {/* Главный слайд — стиль как на Циан */}
      <div
        ref={mainSlideRef}
        tabIndex={0}
        className={cn(
          "relative rounded-2xl overflow-hidden bg-neutral-900 outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          containerAspect,
          fullscreen &&
            "fixed z-[9999] inset-0 rounded-none flex items-center justify-center bg-black min-h-0 aspect-auto"
        )}
        style={fullscreen ? { aspectRatio: undefined } : {}}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleToggleFullscreen();
        }}
        aria-label='Галерея фотографий'
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {fullscreen && (
          <div className='absolute inset-0 bg-black/95 pointer-events-none z-0' />
        )}

        {isLoading && (
          <div className='absolute inset-0 flex items-center justify-center z-20 bg-neutral-900/80 pointer-events-none'>
            <div
              className='w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin'
              aria-hidden
            />
          </div>
        )}

        <MediaSlide
          item={media[currentIndex]}
          index={currentIndex}
          zoom={zoom}
          isActive
          onZoomChange={setZoom}
          className={cn(
            "transition-opacity duration-200 ease-out",
            isLoading ? "opacity-0" : "opacity-100",
            fullscreen && "max-h-[100vh] max-w-full mx-auto"
          )}
          onLoadingChange={(loaded) => setIsLoading(!loaded)}
        />

        {/* Кнопка полноэкранного режима / закрыть — справа сверху */}
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={cn(
            "absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white border-0 shadow-md transition-colors",
            fullscreen && "top-4 right-4 h-11 w-11"
          )}
          aria-label={
            fullscreen ? "Выйти из полноэкранного режима" : "Открыть на весь экран"
          }
          onClick={handleToggleFullscreen}
        >
          {fullscreen ? (
            <CloseIcon className='h-5 w-5 sm:h-6 sm:w-6' />
          ) : (
            <Maximize2 className='h-5 w-5' />
          )}
        </Button>

        {/* Стрелки навигации — по бокам, как на Циан */}
        {hasMore && (
          <>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className={cn(
                "absolute left-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/45 text-white hover:bg-black/65 border-0 shadow-lg transition-colors sm:left-3",
                fullscreen && "left-4 h-12 w-12 sm:left-6"
              )}
              aria-label='Предыдущее фото'
              onClick={handlePrev}
            >
              <ChevronLeft className={cn("h-5 w-5", fullscreen && "h-6 w-6")} />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className={cn(
                "absolute right-2 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-black/45 text-white hover:bg-black/65 border-0 shadow-lg transition-colors sm:right-3",
                fullscreen && "right-4 h-12 w-12 sm:right-6"
              )}
              aria-label='Следующее фото'
              onClick={handleNext}
            >
              <ChevronRight className={cn("h-5 w-5", fullscreen && "h-6 w-6")} />
            </Button>
          </>
        )}

        {/* Счётчик фото — слева снизу, как на Циан */}
        {hasMore && (
          <div
            className={cn(
              "absolute bottom-3 left-3 z-10 rounded-lg bg-black/55 text-white text-sm font-medium px-3 py-1.5 shadow-lg backdrop-blur-sm",
              fullscreen && "bottom-6 left-6 text-base px-4 py-2"
            )}
            aria-live='polite'
          >
            <span>{currentIndex + 1}</span>
            <span className='mx-1.5 text-white/70'>/</span>
            <span>{media.length}</span>
          </div>
        )}
      </div>

      {/* Полоска миниатюр — горизонтальный скролл, как на Циан */}
      {hasMore && (
        <div
          ref={thumbsRef}
          className='flex gap-2 overflow-x-auto p-2 scrollbar-hide scroll-smooth touch-pan-x'
        >
          {media.map((item, idx) => (
            <button
              key={item.id}
              type='button'
              tabIndex={0}
              aria-label={`Фото ${idx + 1} из ${media.length}`}
              aria-current={idx === currentIndex ? "true" : undefined}
              onClick={() => handleThumbnailClick(idx)}
              className={cn(
                "shrink-0 rounded-lg overflow-hidden transition-all duration-200 outline-none",
                idx === currentIndex
                  ? "opacity-100 scale-105"
                  : "opacity-70 hover:opacity-100"
              )}
            >
              <MediaThumbnail
                item={item}
                index={idx}
                onClick={() => {}}
                size='strip'
                className='h-14 w-[4.5rem] sm:h-16 sm:w-20 md:h-[4.5rem] md:w-24 aspect-[4/3]'
                lazy
                placeholder='empty'
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
