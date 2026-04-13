"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X as CloseIcon, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import type { MediaItem, GalleryZoomLevel } from "./types";
import { GALLERY_CONFIG } from "./constants";
import { MediaThumbnail } from "./MediaThumbnail";
import { MediaSlide } from "./MediaSlide";
import { isImage, getMediaUrl, getPrevIndex, getNextIndex } from "./utils";

const { SLIDE_CHANGE_DELAY_MS } = GALLERY_CONFIG;
const SWIPE_THRESHOLD_PX = 50;
const SWIPE_MAX_PREVIEW_PX = 120;

type MediaGridProps = {
  media: MediaItem[];
  initialIndex?: number;
  aspectRatio?: "16/9" | "4/3" | "1/1";
  className?: string;
  emptyStateText?: string;
};

// Utility: Получение aspect класса
const getAspectClass = (aspectRatio: MediaGridProps["aspectRatio"]) => {
  switch (aspectRatio) {
    case "4/3":
      return "aspect-4/3";
    case "1/1":
      return "aspect-square";
    default:
      return "aspect-video";
  }
};

export function MediaGrid({
  media,
  initialIndex = 0,
  aspectRatio = "16/9",
  className,
  emptyStateText = "Нет фото",
}: MediaGridProps) {
  // STATES
  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.max(0, Math.min(initialIndex, Math.max(0, media.length - 1)))
  );
  const [zoom, setZoom] = useState<GalleryZoomLevel>(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [thumbsApi, setThumbsApi] = useState<CarouselApi>();

  // REFS
  const mainSlideRef = useRef<HTMLDivElement | null>(null);
  const thumbsStripRef = useRef<HTMLDivElement | null>(null);
  const slideWrapperRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const swipeOffsetX = useRef(0);
  const slideChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedIndicesRef = useRef<Set<number>>(new Set());
  const currentIndexRef = useRef(currentIndex);
  const prevMediaRef = useRef<MediaItem[]>(media);
  const preloadRequestedRef = useRef<Set<number>>(new Set());

  const hasMore = media.length > 1;

  // --- HANDLERS ---

  // Запустить таймер смены слайда (применяется для плавности)
  const scheduleSlideChange = useCallback((resolveNext: (prev: number) => number) => {
    if (slideChangeTimeoutRef.current) {
      clearTimeout(slideChangeTimeoutRef.current);
      slideChangeTimeoutRef.current = null;
    }
    setZoom(1);
    slideChangeTimeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => {
        const next = resolveNext(prev);
        if (loadedIndicesRef.current.has(next)) setIsLoading(false);
        return next;
      });
      slideChangeTimeoutRef.current = null;
    }, SLIDE_CHANGE_DELAY_MS);
  }, []);

  const handlePrev = useCallback(() => {
    if (isNavigating) return;
    setIsNavigating(true);
    scheduleSlideChange((prev) => getPrevIndex(prev, media.length));
    setTimeout(() => setIsNavigating(false), SLIDE_CHANGE_DELAY_MS + 50);
  }, [isNavigating, media.length, scheduleSlideChange]);

  const handleNext = useCallback(() => {
    if (isNavigating) return;
    setIsNavigating(true);
    scheduleSlideChange((prev) => getNextIndex(prev, media.length));
    setTimeout(() => setIsNavigating(false), SLIDE_CHANGE_DELAY_MS + 50);
  }, [isNavigating, media.length, scheduleSlideChange]);

  const handleLoadingChange = useCallback(
    (loaded: boolean, slideIndex: number | undefined) => {
      if (loaded && slideIndex !== undefined) loadedIndicesRef.current.add(slideIndex);
      if (slideIndex === currentIndexRef.current) setIsLoading(!loaded);
    },
    []
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (thumbsStripRef.current?.contains(e.target as Node)) return;
    touchStartX.current = e.touches[0].clientX;
    swipeOffsetX.current = 0;
    if (slideWrapperRef.current) slideWrapperRef.current.style.transform = "";
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (zoom !== 1 || !hasMore) return;
      if (thumbsStripRef.current?.contains(e.target as Node)) return;
      const w = slideWrapperRef.current;
      if (!w) return;
      const diff = touchStartX.current - e.touches[0].clientX;
      const clamped = Math.max(
        -SWIPE_MAX_PREVIEW_PX,
        Math.min(SWIPE_MAX_PREVIEW_PX, diff)
      );
      swipeOffsetX.current = clamped;
      w.style.transform = `translate3d(${clamped}px, 0, 0)`;
    },
    [zoom, hasMore]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (thumbsStripRef.current?.contains(e.target as Node)) return;
      if (slideWrapperRef.current) slideWrapperRef.current.style.transform = "";
      swipeOffsetX.current = 0;
      if (zoom !== 1 || !hasMore) return;
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) > SWIPE_THRESHOLD_PX) {
        if (diff > 0) handleNext();
        else handlePrev();
      }
    },
    [zoom, hasMore, handlePrev, handleNext]
  );

  const handleThumbnailClick = useCallback(
    (idx: number) => scheduleSlideChange(() => idx),
    [scheduleSlideChange]
  );

  const handleToggleFullscreen = useCallback(() => {
    setFullscreen((prev) => !prev);
    setZoom(1);
    setTimeout(() => mainSlideRef.current?.focus(), 200);
  }, []);

  const handleZoomChange = useCallback(
    (newZoom: GalleryZoomLevel) => setZoom(newZoom),
    []
  );

  // --- EFFECTS ---

  // Update currentIndexRef on currentIndex change
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Reset gallery if media set changes
  useEffect(() => {
    if (prevMediaRef.current === media) return;
    prevMediaRef.current = media;
    const t = setTimeout(() => {
      setCurrentIndex(0);
      loadedIndicesRef.current.clear();
      preloadRequestedRef.current.clear();
      setIsLoading(true);
    }, 0);

    return () => clearTimeout(t);
  }, [media]);

  // Прокрутка полосы миниатюр (Embla / shadcn Carousel)
  useEffect(() => {
    if (!thumbsApi || !hasMore) return;
    thumbsApi.scrollTo(currentIndex);
  }, [thumbsApi, currentIndex, hasMore]);

  // Preload соседние изображения
  useEffect(() => {
    const prevIdx = getPrevIndex(currentIndex, media.length);
    const nextIdx = getNextIndex(currentIndex, media.length);

    [prevIdx, nextIdx].forEach((idx) => {
      if (loadedIndicesRef.current.has(idx) || preloadRequestedRef.current.has(idx))
        return;
      const item = media[idx];
      if (!isImage(item)) return;

      preloadRequestedRef.current.add(idx);
      const img = new window.Image();
      img.onload = () => loadedIndicesRef.current.add(idx);
      img.onerror = () => preloadRequestedRef.current.delete(idx);
      img.src = getMediaUrl(item, false);
    });
  }, [currentIndex, media]);

  // Slide change timer cancel on unmount
  useEffect(() => {
    return () => {
      if (slideChangeTimeoutRef.current) clearTimeout(slideChangeTimeoutRef.current);
    };
  }, []);

  // Keyboard events (fullscreen Navigation, zoom, esc)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!fullscreen && document.activeElement !== mainSlideRef.current) return;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          handlePrev();
          break;
        case "ArrowRight":
          e.preventDefault();
          handleNext();
          break;
        case "+":
        case "=":
          if (zoom === 1) setZoom(2);
          break;
        case "-":
        case "_":
          if (zoom === 2) setZoom(1);
          break;
        case "Escape":
          if (fullscreen) setFullscreen(false);
          break;
        default:
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoom, fullscreen, currentIndex, handlePrev, handleNext]);

  // --- RENDER ---

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

  const containerAspect = getAspectClass(aspectRatio);

  return (
    <div className={cn("", className)}>
      <div
        ref={mainSlideRef}
        role='region'
        aria-label={`Галерея изображений, ${media.length} элементов`}
        aria-roledescription='Галерея с миниатюрами'
        tabIndex={0}
        className={cn(
          "group/gallery relative overflow-hidden rounded-2xl bg-neutral-900 outline-none transition-shadow",
          containerAspect,
          fullscreen &&
            "fixed z-9999 inset-0 flex aspect-auto min-h-0 max-h-none items-center justify-center rounded-none bg-black"
        )}
        style={fullscreen ? { aspectRatio: undefined } : {}}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleToggleFullscreen();
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {fullscreen && (
          <div
            className='absolute inset-0 bg-black/95 pointer-events-none z-0'
            aria-hidden
          />
        )}

        {isLoading && (
          <div
            className='absolute inset-0 flex items-center justify-center z-20 bg-neutral-900/80 pointer-events-none'
            aria-busy='true'
          >
            <div
              className='w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin'
              aria-hidden
            />
          </div>
        )}

        <div
          ref={slideWrapperRef}
          className='w-full h-full transition-transform duration-0'
          style={{ willChange: zoom === 1 && hasMore ? "transform" : undefined }}
        >
          <MediaSlide
            item={media[currentIndex]}
            index={currentIndex}
            zoom={zoom}
            isActive
            onZoomChange={handleZoomChange}
            onLoadingChange={handleLoadingChange}
            className={cn(
              "transition-opacity duration-200 ease-out",
              isLoading ? "opacity-0" : "opacity-100",
              fullscreen && "max-h-screen max-w-full mx-auto"
            )}
            aria-busy={isLoading}
          />
        </div>

        {/* Полноэкран: справа сверху на снимке */}
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={cn(
            "absolute right-2 top-2 z-20 size-10 rounded-full border border-white/20 bg-black/50 text-white shadow-lg backdrop-blur-md transition-all hover:bg-black/65 focus-visible:ring-2 focus-visible:ring-white/40 md:right-3 md:top-3 md:size-11",
            fullscreen && "right-6 top-6 size-12 opacity-100",
            !fullscreen &&
              "max-md:opacity-100 md:opacity-0 md:pointer-events-none md:transition-opacity md:duration-200 md:group-hover/gallery:opacity-100 md:group-hover/gallery:pointer-events-auto md:group-focus-within/gallery:opacity-100 md:group-focus-within/gallery:pointer-events-auto"
          )}
          aria-label={
            fullscreen ? "Выйти из полноэкранного режима" : "Открыть на весь экран"
          }
          onClick={handleToggleFullscreen}
        >
          {fullscreen ? (
            <CloseIcon className='size-5 md:size-6' />
          ) : (
            <Maximize2 className='size-5 md:size-6' />
          )}
        </Button>

        {/* Стрелки: только десктоп — на мобильных свайп и миниатюры */}
        {hasMore && (
          <>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className={cn(
                "absolute left-2 top-1/2 z-20 hidden size-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/45 text-white shadow-lg backdrop-blur-md hover:bg-black/60 md:flex md:size-11",
                fullscreen && "left-5 size-12 opacity-100 pointer-events-auto",
                !fullscreen &&
                  "opacity-0 pointer-events-none transition-opacity duration-200 group-hover/gallery:opacity-100 group-hover/gallery:pointer-events-auto group-focus-within/gallery:opacity-100 group-focus-within/gallery:pointer-events-auto"
              )}
              aria-label='Предыдущее фото'
              onClick={handlePrev}
              tabIndex={-1}
            >
              <ChevronLeft className={cn("size-5", fullscreen && "size-6")} />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className={cn(
                "absolute right-2 top-1/2 z-20 hidden size-10 -translate-y-1/2 rounded-full border border-white/20 bg-black/45 text-white shadow-lg backdrop-blur-md hover:bg-black/60 md:flex md:size-11",
                fullscreen && "right-5 size-12 opacity-100 pointer-events-auto",
                !fullscreen &&
                  "opacity-0 pointer-events-none transition-opacity duration-200 group-hover/gallery:opacity-100 group-hover/gallery:pointer-events-auto group-focus-within/gallery:opacity-100 group-focus-within/gallery:pointer-events-auto"
              )}
              aria-label='Следующее фото'
              onClick={handleNext}
              tabIndex={-1}
            >
              <ChevronRight className={cn("size-5", fullscreen && "size-6")} />
            </Button>
          </>
        )}

        {/* Мобильные точки — компактно; на md+ счётчик 1/n по hover (в полноэкране всегда видно) */}
        {hasMore && (
          <>
            <div
              className={cn(
                "absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 md:hidden",
                "px-2 py-1"
              )}
              aria-hidden
            >
              {media.map((item, i) => (
                <span
                  key={item.id}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-transform",
                    i === currentIndex ? "scale-110 bg-white shadow-sm" : "bg-white/45"
                  )}
                />
              ))}
            </div>
            <div
              className={cn(
                "absolute bottom-3 left-1/2 z-20 hidden min-w-[4.25rem] -translate-x-1/2 items-center justify-center gap-0.5 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-md tabular-nums md:flex",
                fullscreen && "bottom-7 px-5 py-1.5 text-sm opacity-100",
                !fullscreen &&
                  "pointer-events-none opacity-0 transition-opacity duration-200 group-hover/gallery:opacity-100 group-focus-within/gallery:opacity-100"
              )}
              aria-live='polite'
              aria-atomic='true'
            >
              <span>{currentIndex + 1}</span>
              <span className='text-white/70'>/</span>
              <span>{media.length}</span>
            </div>
          </>
        )}
      </div>

      {/* Полоса миниатюр: shadcn Carousel (Embla) — свайп и snap на мобильных */}
      {hasMore && (
        <div
          ref={thumbsStripRef}
          className='w-full rounded-b-xl bg-gradient-to-t from-muted/30 to-transparent pb-2 pt-2'
        >
          <Carousel
            opts={{
              align: "center",
              containScroll: "trimSnaps",
              dragFree: true,
            }}
            setApi={setThumbsApi}
            className='w-full'
          >
            <CarouselContent className='-ml-2 justify-center sm:justify-start'>
              {media.map((item, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <CarouselItem key={item.id} className='basis-auto pl-2'>
                    <button
                      type='button'
                      tabIndex={0}
                      aria-label={`Фото ${idx + 1} из ${media.length}`}
                      aria-current={isActive || undefined}
                      onClick={() => handleThumbnailClick(idx)}
                      className={cn(
                        "overflow-hidden rounded-xl border-2 outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        isActive
                          ? "scale-105 border-primary opacity-100 shadow-lg ring-1 ring-primary/20"
                          : "scale-100 border-transparent opacity-70 hover:scale-[1.02] hover:opacity-100"
                      )}
                    >
                      <MediaThumbnail
                        item={item}
                        index={idx}
                        onClick={() => {}}
                        size='strip'
                        className='aspect-4/3 h-14 w-[4.5rem] bg-neutral-100 object-cover sm:h-16 sm:w-24 md:h-[4.5rem] md:w-28'
                        lazy
                        placeholder='empty'
                      />
                    </button>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
          </Carousel>
        </div>
      )}
    </div>
  );
}
