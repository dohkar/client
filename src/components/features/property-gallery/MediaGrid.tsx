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

  // при смене медиа (или initialIndex) — аккуратно ресетимся
  useEffect(() => {
    setCurrentIndex(clampedInitialIndex);
    mainApi?.scrollTo(clampedInitialIndex);
    thumbsApi?.scrollTo(clampedInitialIndex);
    fullscreenApi?.scrollTo(clampedInitialIndex);
  }, [clampedInitialIndex, mainApi, thumbsApi, fullscreenApi]);

  const syncFromApi = useCallback(
    (api: CarouselApi | undefined) => {
      if (!api) return;
      const idx = api.selectedScrollSnap();
      setCurrentIndex(idx);
      thumbsApi?.scrollTo(idx);
    },
    [thumbsApi]
  );

  // подписываемся на select/reInit главного каруселя
  useEffect(() => {
    if (!mainApi) return;
    const onSelect = () => syncFromApi(mainApi);
    mainApi.on("select", onSelect);
    mainApi.on("reInit", onSelect);
    onSelect();
    return () => {
      mainApi.off("select", onSelect);
      mainApi.off("reInit", onSelect);
    };
  }, [mainApi, syncFromApi]);

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

  // при открытом fullscreen синхронизируем позицию
  useEffect(() => {
    if (!isFullscreenOpen) return;
    fullscreenApi?.scrollTo(currentIndex);
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
                    onClick={() => setIsFullscreenOpen(true)}
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

          {/* стрелки (простые, всегда видимы на md+) */}
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

        {/* fullscreen toggle */}
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className='absolute right-2 top-2 z-20 size-10 rounded-full border border-border/50 bg-background/80 text-foreground shadow-lg backdrop-blur-md transition-all hover:bg-background/90 focus-visible:ring-2 focus-visible:ring-ring md:right-3 md:top-3 md:size-11'
          aria-label='Открыть на весь экран'
          onClick={() => setIsFullscreenOpen(true)}
        >
          <Maximize2 className='size-5 md:size-6' />
        </Button>

        {/* счётчик */}
        {hasMore ? (
          <div className='absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-xs font-semibold text-white shadow-md backdrop-blur-md tabular-nums'>
            {currentIndex + 1} / {media.length}
          </div>
        ) : null}
      </div>

      {/* миниатюры снизу */}
      {hasMore ? (
        <div className='mt-2 w-full rounded-xl border border-border/50 bg-muted/10 px-1 pb-1.5 pt-2'>
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
                      aria-label={`Показать ${idx + 1} из ${media.length}`}
                      aria-current={isActive || undefined}
                      onClick={() => goToIndex(idx)}
                      className={cn(
                        "relative overflow-hidden rounded-lg outline-none ring-offset-2 transition-[box-shadow,opacity,transform] duration-150 focus-visible:ring-2 focus-visible:ring-ring",
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
          <div className='relative h-full w-full'>
            <div className='absolute left-4 top-4 z-20 rounded-full bg-black/60 px-3 py-1 text-sm font-semibold text-white backdrop-blur'>
              {currentIndex + 1} / {media.length}
            </div>
            <div className='h-full w-full'>
              <Carousel
                opts={{
                  align: "start",
                  containScroll: "trimSnaps",
                  loop: hasMore,
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
