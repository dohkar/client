"use client";

import Image from "next/image";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { MediaItem } from "./types";
import { MediaThumbnail } from "./MediaThumbnail";
import { getMediaAlt, getMediaUrl, isVideo } from "./utils";

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
  const hasMore = media.length > 1;
  const containerAspect = getAspectClass(aspectRatio);

  const clampedInitialIndex = useMemo(() => {
    if (media.length === 0) return 0;
    return Math.max(0, Math.min(initialIndex, media.length - 1));
  }, [initialIndex, media.length]);

  const [currentIndex, setCurrentIndex] = useState(clampedInitialIndex);
  const [mainApi, setMainApi] = useState<CarouselApi>();
  const [thumbsApi, setThumbsApi] = useState<CarouselApi>();
  const [fullscreenApi, setFullscreenApi] = useState<CarouselApi>();
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  /** Индекс при открытии модалки (в opts, без ref при render — правило ESLint). */
  const [fullscreenStartIndex, setFullscreenStartIndex] = useState(0);

  const openFullscreen = useCallback(() => {
    const idx = mainApi?.selectedScrollSnap() ?? currentIndex;
    setFullscreenStartIndex(idx);
    setIsFullscreenOpen(true);
  }, [mainApi, currentIndex, setFullscreenStartIndex, setIsFullscreenOpen]);

  // Только главная лента и миниатюры: стартовый индекс / смена листинга.
  // Fullscreen НЕ трогаем здесь: при появлении `fullscreenApi` иначе всегда уезжали на `clampedInitialIndex` (обычно 0).
  useEffect(() => {
    mainApi?.scrollTo(clampedInitialIndex);
    thumbsApi?.scrollTo(clampedInitialIndex);
  }, [clampedInitialIndex, mainApi, thumbsApi]);

  const syncFromMainApi = useCallback(
    (api: CarouselApi | undefined) => {
      if (!api) return;
      const idx = api.selectedScrollSnap();
      setCurrentIndex(idx);
      thumbsApi?.scrollTo(idx);
    },
    [thumbsApi]
  );

  const syncFromFullscreenApi = useCallback(
    (api: CarouselApi | undefined) => {
      if (!api) return;
      const idx = api.selectedScrollSnap();
      setCurrentIndex(idx);
      thumbsApi?.scrollTo(idx);
      mainApi?.scrollTo(idx);
    },
    [mainApi, thumbsApi]
  );

  // Главная лента: индекс + миниатюры (fullscreen закрыт или не трогаем main)
  useEffect(() => {
    if (!mainApi || isFullscreenOpen) return;
    const onSelect = () => syncFromMainApi(mainApi);
    mainApi.on("select", onSelect);
    mainApi.on("reInit", onSelect);
    onSelect();
    return () => {
      mainApi.off("select", onSelect);
      mainApi.off("reInit", onSelect);
    };
  }, [mainApi, isFullscreenOpen, syncFromMainApi]);

  // Fullscreen: свайп обновляет индекс и подстраивает main + thumbs (без немедленного onSelect — иначе до scrollTo читается 0-й слайд).
  useEffect(() => {
    if (!fullscreenApi || !isFullscreenOpen) return;
    const onSelect = () => syncFromFullscreenApi(fullscreenApi);
    fullscreenApi.on("select", onSelect);
    fullscreenApi.on("reInit", onSelect);
    return () => {
      fullscreenApi.off("select", onSelect);
      fullscreenApi.off("reInit", onSelect);
    };
  }, [fullscreenApi, isFullscreenOpen, syncFromFullscreenApi]);

  const goToIndex = useCallback(
    (idx: number) => {
      if (!mainApi) {
        setCurrentIndex(Math.max(0, Math.min(idx, media.length - 1)));
        return;
      }
      mainApi.scrollTo(idx);
    },
    [mainApi, media.length]
  );

  const goPrev = useCallback(() => {
    mainApi?.scrollPrev();
  }, [mainApi]);

  const goNext = useCallback(() => {
    mainApi?.scrollNext();
  }, [mainApi]);

  // Открыли модалку или сменился индекс снаружи — прокрутить fullscreen к текущему кадру (после монтирования Embla).
  useEffect(() => {
    if (!isFullscreenOpen || !fullscreenApi) return;
    const id = requestAnimationFrame(() => {
      fullscreenApi.scrollTo(currentIndex);
    });
    return () => cancelAnimationFrame(id);
  }, [currentIndex, fullscreenApi, isFullscreenOpen]);

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

  return (
    <div className={cn("", className)}>
      <div
        className={cn(
          "group/gallery relative overflow-hidden rounded-2xl bg-neutral-900",
          containerAspect
        )}
      >
        <Carousel
          opts={{
            align: "start",
            containScroll: "trimSnaps",
            loop: hasMore,
          }}
          setApi={setMainApi}
          className='h-full w-full'
        >
          <CarouselContent className='h-full'>
            {media.map((item, idx) => {
              const isVideoItem = isVideo(item);
              return (
                <CarouselItem key={item.id} className='h-full min-h-0'>
                  <button
                    type='button'
                    className='relative block h-full min-h-0 w-full cursor-zoom-in'
                    onClick={openFullscreen}
                    aria-label={`Открыть медиа ${idx + 1} из ${media.length} на весь экран`}
                  >
                    {isVideoItem ? (
                      <div className='absolute inset-0 flex items-center justify-center bg-black'>
                        <video
                          src={getMediaUrl(item, false)}
                          controls
                          playsInline
                          className='h-full w-full object-contain'
                        />
                        <div className='pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur'>
                          <Play className='size-3.5' />
                          Видео
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={getMediaUrl(item, false)}
                        alt={getMediaAlt(item, idx)}
                        fill
                        priority={idx === 0}
                        sizes='(max-width: 1280px) 100vw, 1280px'
                        className='object-contain'
                      />
                    )}
                  </button>
                </CarouselItem>
              );
            })}
          </CarouselContent>

          {hasMore ? (
            <>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute left-2 top-1/2 z-20 hidden size-11 -translate-y-1/2 rounded-full border border-white/20 bg-black/45 text-white shadow-lg backdrop-blur-md hover:bg-black/60 md:flex'
                aria-label='Предыдущее'
                onClick={goPrev}
              >
                <ChevronLeft className='size-6' />
              </Button>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute right-2 top-1/2 z-20 hidden size-11 -translate-y-1/2 rounded-full border border-white/20 bg-black/45 text-white shadow-lg backdrop-blur-md hover:bg-black/60 md:flex'
                aria-label='Следующее'
                onClick={goNext}
              >
                <ChevronRight className='size-6' />
              </Button>
            </>
          ) : null}
        </Carousel>

        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='absolute right-2 top-2 z-20 size-10 rounded-full border border-border/50 bg-background/80 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-background/90 focus-visible:ring-2 focus-visible:ring-ring md:right-3 md:top-3 md:size-11'
          aria-label='Открыть на весь экран'
          onClick={openFullscreen}
        >
          <Maximize2 className='size-5 md:size-6' />
        </Button>

        {hasMore ? (
          <div className='absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-md tabular-nums'>
            {currentIndex + 1} / {media.length}
          </div>
        ) : null}
      </div>

      {/* миниатюры снизу — отступы и без overflow-hidden на кнопке, иначе ring обрезается */}
      {hasMore ? (
        <div className='mt-2 w-full rounded-xl border border-border/50 bg-muted/10 px-2 py-2 sm:px-3 sm:py-2.5'>
          <Carousel
            opts={{
              align: "start",
              containScroll: "trimSnaps",
              dragFree: true,
            }}
            setApi={setThumbsApi}
            className='w-full'
          >
            <CarouselContent className='-ml-1.5 mr-1.5 justify-start'>
              {media.map((item, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <CarouselItem
                    key={item.id}
                    className='basis-auto py-0.5 pl-2 sm:py-1 sm:pl-2.5'
                  >
                    <button
                      type='button'
                      aria-label={`Показать ${idx + 1} из ${media.length}`}
                      aria-current={isActive || undefined}
                      onClick={() => goToIndex(idx)}
                      className={cn(
                        "relative rounded-lg outline-none ring-offset-2 ring-offset-background transition-[box-shadow,opacity,transform] duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                        isActive
                          ? "z-10 opacity-100 shadow-md ring-2 ring-primary/60"
                          : "opacity-80 hover:opacity-100 hover:ring-1 hover:ring-border"
                      )}
                    >
                      <MediaThumbnail
                        item={item}
                        index={idx}
                        onClick={() => {}}
                        size='strip'
                        className='aspect-4/3 h-11 w-13 bg-muted object-cover sm:h-13 sm:w-17 md:h-14 md:w-19'
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
      ) : null}

      {/* fullscreen диалог (без зума/панорамирования — максимально просто) */}
      <Dialog
        open={isFullscreenOpen}
        onOpenChange={(open) => {
          setIsFullscreenOpen(open);
        }}
      >
        <DialogContent
          className='h-dvh w-screen max-w-none translate-x-[-50%] translate-y-[-50%] rounded-none border-0 bg-black p-0'
          showCloseButton
        >
          <DialogTitle className='sr-only'>Галерея медиа</DialogTitle>
          <div className='relative h-full w-full pt-14 pb-6 sm:pt-16'>
            <div className='absolute left-4 top-4 z-20 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white backdrop-blur sm:left-5 sm:top-5'>
              {currentIndex + 1} / {media.length}
            </div>
            <div className='h-full min-h-0 w-full'>
              <Carousel
                opts={{
                  align: "start",
                  containScroll: "trimSnaps",
                  loop: hasMore,
                  startIndex: fullscreenStartIndex,
                }}
                setApi={setFullscreenApi}
                className='h-full w-full'
              >
                <CarouselContent className='h-full'>
                  {media.map((item, idx) => {
                    const isVideoItem = isVideo(item);
                    return (
                      <CarouselItem key={`${item.id}-fs`} className='h-full min-h-0'>
                        <div className='relative h-full min-h-0 w-full'>
                          {isVideoItem ? (
                            <div className='absolute inset-0 flex items-center justify-center bg-black'>
                              <video
                                src={getMediaUrl(item, false)}
                                controls
                                playsInline
                                className='h-full w-full object-contain'
                              />
                            </div>
                          ) : (
                            <Image
                              src={getMediaUrl(item, false)}
                              alt={getMediaAlt(item, idx)}
                              fill
                              sizes='100vw'
                              className='object-contain'
                            />
                          )}
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
              </Carousel>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
