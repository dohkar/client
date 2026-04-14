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
import { MediaThumbnail } from "./MediaThumbnail";
import { MediaSlide } from "./MediaSlide";
import { isImage, getMediaUrl, getPrevIndex, getNextIndex } from "./utils";

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
  const loadedIndicesRef = useRef<Set<number>>(new Set());
  const currentIndexRef = useRef(currentIndex);
  const prevMediaRef = useRef<MediaItem[] | null>(null);

  const hasMore = media.length > 1;

  const goToIndex = useCallback(
    (next: number) => {
      if (media.length === 0) return;
      const clamped = Math.max(0, Math.min(next, media.length - 1));
      setZoom(1);
      currentIndexRef.current = clamped;
      setIsLoading(!loadedIndicesRef.current.has(clamped));
      setCurrentIndex(clamped);
    },
    [media.length]
  );

  const handlePrev = useCallback(() => {
    if (isNavigating || media.length < 2) return;
    setIsNavigating(true);
    goToIndex(getPrevIndex(currentIndexRef.current, media.length));
    window.setTimeout(() => setIsNavigating(false), 32);
  }, [isNavigating, media.length, goToIndex]);

  const handleNext = useCallback(() => {
    if (isNavigating || media.length < 2) return;
    setIsNavigating(true);
    goToIndex(getNextIndex(currentIndexRef.current, media.length));
    window.setTimeout(() => setIsNavigating(false), 32);
  }, [isNavigating, media.length, goToIndex]);

  const handleLoadingChange = useCallback(
    (loaded: boolean, slideIndex: number | undefined) => {
      if (loaded && slideIndex !== undefined) {
        loadedIndicesRef.current.add(slideIndex);
        if (slideIndex === currentIndexRef.current) setIsLoading(false);
      }
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
      w.style.transform = `translate3d(${-clamped}px, 0, 0)`;
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
    (idx: number) => {
      goToIndex(idx);
    },
    [goToIndex]
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

  // Смена набора медиа: предзагрузка всех кадров; сброс индекса — только при смене списка (setState вне тела эффекта — microtask)
  useEffect(() => {
    if (prevMediaRef.current === media) return;
    const isInitialMount = prevMediaRef.current === null;
    prevMediaRef.current = media;

    const startPreload = () => {
      media.forEach((item, idx) => {
        if (!isImage(item)) {
          loadedIndicesRef.current.add(idx);
          return;
        }
        const img = new window.Image();
        img.onload = () => {
          loadedIndicesRef.current.add(idx);
          if (idx === currentIndexRef.current) setIsLoading(false);
        };
        img.onerror = () => {};
        img.src = getMediaUrl(item, false);
      });
    };

    if (isInitialMount) {
      startPreload();
      return;
    }

    queueMicrotask(() => {
      loadedIndicesRef.current.clear();
      currentIndexRef.current = 0;
      setCurrentIndex(0);
      setZoom(1);
      setIsLoading(true);
      startPreload();
    });
  }, [media]);

  // Прокрутка полосы миниатюр (Embla / shadcn Carousel)
  useEffect(() => {
    if (!thumbsApi || !hasMore) return;
    thumbsApi.scrollTo(currentIndex);
  }, [thumbsApi, currentIndex, hasMore]);

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
            className='pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-neutral-900/40'
            aria-busy='true'
          >
            <div
              className='size-9 rounded-full border-2 border-white/25 border-t-white animate-spin md:size-10'
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
            className={cn(fullscreen && "mx-auto max-h-screen max-w-full")}
            aria-busy={isLoading}
          />
        </div>

        {/* Полноэкран: справа сверху на снимке */}
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={cn(
            "absolute right-2 top-2 z-20 size-10 rounded-full border border-border/50 bg-background/80 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-background/90 focus-visible:ring-2 focus-visible:ring-ring md:right-3 md:top-3 md:size-11",
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
          className='w-full rounded-b-xl border-t border-border/40 bg-muted/20 px-1 pb-1.5 pt-2'
        >
          <Carousel
            opts={{
              align: "start",
              containScroll: "trimSnaps",
              dragFree: true,
            }}
            setApi={setThumbsApi}
            className='w-full'
          >
            <CarouselContent className='-ml-1.5 justify-start sm:-ml-2'>
              {media.map((item, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <CarouselItem key={item.id} className='basis-auto pl-1.5 sm:pl-2'>
                    <button
                      type='button'
                      tabIndex={0}
                      aria-label={`Фото ${idx + 1} из ${media.length}`}
                      aria-current={isActive || undefined}
                      onClick={() => handleThumbnailClick(idx)}
                      className={cn(
                        "relative overflow-hidden rounded-lg outline-none ring-offset-2 transition-[box-shadow,opacity,transform] duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "z-10 opacity-100 shadow-md"
                          : "opacity-80 hover:opacity-100 hover:ring-1 hover:ring-border"
                      )}
                    >
                      <MediaThumbnail
                        item={item}
                        index={idx}
                        onClick={() => {}}
                        size='strip'
                        className='aspect-[4/3] h-11 w-[3.25rem] bg-muted object-cover sm:h-[3.25rem] sm:w-[4.25rem] md:h-14 md:w-[4.75rem]'
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
