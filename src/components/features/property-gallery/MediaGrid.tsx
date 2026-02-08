"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, X as CloseIcon, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  // REFS
  const mainSlideRef = useRef<HTMLDivElement | null>(null);
  const thumbsRef = useRef<HTMLDivElement>(null);
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
    if (thumbsRef.current?.contains(e.target as Node)) return;
    touchStartX.current = e.touches[0].clientX;
    swipeOffsetX.current = 0;
    if (slideWrapperRef.current) slideWrapperRef.current.style.transform = "";
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (zoom !== 1 || !hasMore) return;
      if (thumbsRef.current?.contains(e.target as Node)) return;
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
      if (thumbsRef.current?.contains(e.target as Node)) return;
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

  // Scroll to active thumbnail
  useEffect(() => {
    if (!thumbsRef.current) return;
    const activeThumb = thumbsRef.current.children[currentIndex] as
      | HTMLElement
      | undefined;
    if (activeThumb) {
      activeThumb.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentIndex]);

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
          "relative rounded-2xl overflow-hidden bg-neutral-900 outline-none transition-shadow",
          containerAspect,
          fullscreen &&
            "fixed z-9999 inset-0 rounded-none flex items-center justify-center bg-black min-h-0 aspect-auto"
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

        {/* Кнопка полноэкранного режима */}
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={cn(
            "absolute top-4 right-4 z-20 h-11 w-11 rounded-full bg-white/60 text-black hover:bg-white/80 border border-white/70 shadow-xl transition-all backdrop-blur-sm focus:outline-none group",
            fullscreen && "top-6 right-6 h-13 w-13"
          )}
          aria-label={
            fullscreen ? "Выйти из полноэкранного режима" : "Открыть на весь экран"
          }
          onClick={handleToggleFullscreen}
        >
          {fullscreen ? (
            <CloseIcon className='h-6 w-6 group-hover:scale-110 transition-transform' />
          ) : (
            <Maximize2 className='h-6 w-6 group-hover:scale-110 transition-transform' />
          )}
        </Button>

        {/* Стрелки навигации улучшенные */}
        {hasMore && (
          <>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/60 text-black hover:bg-white/80 border border-white/70 shadow-xl transition-all backdrop-blur-sm focus:outline-none group opacity-90 hover:opacity-100",
                fullscreen && "left-6 h-13 w-13"
              )}
              aria-label='Предыдущее фото'
              onClick={handlePrev}
              tabIndex={-1}
            >
              <ChevronLeft
                className={cn(
                  "h-6 w-6 group-hover:scale-110 transition-transform",
                  fullscreen && "h-7 w-7"
                )}
              />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 z-20 h-11 w-11 rounded-full bg-white/60 text-black hover:bg-white/80 border border-white/70 shadow-xl transition-all backdrop-blur-sm focus:outline-none group opacity-90 hover:opacity-100",
                fullscreen && "right-6 h-13 w-13"
              )}
              aria-label='Следующее фото'
              onClick={handleNext}
              tabIndex={-1}
            >
              <ChevronRight
                className={cn(
                  "h-6 w-6 group-hover:scale-110 transition-transform",
                  fullscreen && "h-7 w-7"
                )}
              />
            </Button>
          </>
        )}

        {/* Индикатор текущей позиции */}
        {hasMore && (
          <div
            className={cn(
              "absolute bottom-3 left-1/2 -translate-x-1/2 z-20 rounded-lg bg-black/70 text-white text-base font-semibold px-5 py-2 shadow-lg backdrop-blur-lg border border-white/15 flex items-center gap-1.5",
              fullscreen && "bottom-7 px-7 py-3 text-lg"
            )}
            aria-live='polite'
            aria-atomic='true'
            style={{
              letterSpacing: ".02em",
              minWidth: 68,
              justifyContent: "center",
            }}
          >
            <span className='tabular-nums'>{currentIndex + 1}</span>
            <span className='mx-1 text-white/80 select-none'>/</span>
            <span className='tabular-nums'>{media.length}</span>
          </div>
        )}
      </div>

      {/* Галерея превьюшек */}
      {hasMore && (
        <div
          ref={thumbsRef}
          className='flex gap-2 overflow-x-auto pb-3 pt-1 px-2 scrollbar-hide scroll-smooth touch-pan-x w-full justify-center bg-gradient-to-t from-black/10 via-black/5 to-transparent rounded-b-lg shadow-inner'
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {media.map((item, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={item.id}
                type='button'
                tabIndex={0}
                aria-label={`Фото ${idx + 1} из ${media.length}`}
                aria-current={isActive || undefined}
                onClick={() => handleThumbnailClick(idx)}
                className={cn(
                  "shrink-0 rounded-xl overflow-hidden transition-all duration-200 outline-none border-2 focus:outline-none",
                  isActive
                    ? "border-primary-500 opacity-100 scale-110 shadow-lg"
                    : "border-transparent opacity-70 hover:opacity-100 hover:scale-105"
                )}
                style={{
                  boxShadow: isActive ? "0 0 1.5rem 0 rgba(53,122,255,0.10)" : undefined,
                  transition: "all 0.18s cubic-bezier(.4,0,.2,1)",
                }}
              >
                <MediaThumbnail
                  item={item}
                  index={idx}
                  onClick={() => {}}
                  size='strip'
                  className='h-16 w-24 sm:h-18 sm:w-28 md:h-20 md:w-32 aspect-4/3 bg-neutral-100 object-cover'
                  lazy
                  placeholder='empty'
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
