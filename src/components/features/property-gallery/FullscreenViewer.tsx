"use client";

import { useEffect, useCallback, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/lib/utils/cn";
import type { MediaItem } from "./types";
import { MediaSlide } from "./MediaSlide";
import { GalleryControls } from "./GalleryControls";
import { GalleryThumbs } from "./GalleryThumbs";
import { isImage } from "./utils";

type FullscreenViewerProps = {
  media: MediaItem[];
  isOpen: boolean;
  activeIndex: number;
  zoom: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onDoubleClick: () => void;
};

export function FullscreenViewer({
  media,
  isOpen,
  activeIndex,
  zoom,
  onClose,
  onIndexChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onDoubleClick,
}: FullscreenViewerProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: media.length > 1,
    startIndex: activeIndex,
    skipSnaps: false,
    dragFree: false,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Синхронизация embla с activeIndex
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const selectedIndex = emblaApi.selectedScrollSnap();
      if (selectedIndex !== activeIndex) {
        onIndexChange(selectedIndex);
        onResetZoom();
      }
    };

    emblaApi.on("select", onSelect);

    // Переход к нужному слайду при изменении activeIndex извне
    if (emblaApi.selectedScrollSnap() !== activeIndex) {
      emblaApi.scrollTo(activeIndex);
    }

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi, activeIndex, onIndexChange, onResetZoom]);

  // Preload соседних медиа
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    const preloadIndexes = [
      activeIndex,
      activeIndex > 0 ? activeIndex - 1 : media.length - 1,
      activeIndex < media.length - 1 ? activeIndex + 1 : 0,
    ];

    const links: HTMLLinkElement[] = [];

    // Создаем скрытые элементы для preload
    preloadIndexes.forEach((index) => {
      const item = media[index];
      if (item) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = item.type === "image" ? "image" : "video";
        link.href = item.src;
        document.head.appendChild(link);
        links.push(link);
      }
    });

    return () => {
      links.forEach((link) => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      });
    };
  }, [activeIndex, media, isOpen]);

  // Закрытие по клику вне контента
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Закрываем только если клик был именно на backdrop, а не на дочерних элементах
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Focus trap
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    firstElement?.focus();
    document.addEventListener("keydown", handleTabKey);

    return () => {
      document.removeEventListener("keydown", handleTabKey);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentItem = media[activeIndex];
  const canZoom = currentItem ? isImage(currentItem) : false;
  const showPrev = media.length > 1;
  const showNext = media.length > 1;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Галерея медиа"
    >
      {/* Анимация появления */}
      <div
        className={cn(
          "w-full h-full flex flex-col transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Embla Carousel */}
        <div className="flex-1 flex items-center justify-center overflow-hidden">
          <div ref={emblaRef} className="w-full h-full overflow-hidden">
            <div className="flex h-full">
              {media.map((item, index) => (
                <div key={item.id} className="flex-[0_0_100%] min-w-0 h-full">
                  <MediaSlide
                    item={item}
                    index={index}
                    zoom={index === activeIndex ? zoom : 1}
                    isActive={index === activeIndex}
                    onDoubleClick={
                      index === activeIndex && zoom === 1
                        ? onZoomIn
                        : index === activeIndex && zoom > 1
                          ? onResetZoom
                          : undefined
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Controls */}
        <GalleryControls
          onClose={onClose}
          onPrev={() => {
            emblaApi?.scrollPrev();
          }}
          onNext={() => {
            emblaApi?.scrollNext();
          }}
          onZoomIn={canZoom ? onZoomIn : undefined}
          onZoomOut={canZoom && zoom > 1 ? onZoomOut : undefined}
          canZoom={canZoom}
          showPrev={showPrev}
          showNext={showNext}
        />

        {/* Thumbnails */}
        <GalleryThumbs
          media={media}
          activeIndex={activeIndex}
          onThumbClick={(index) => {
            emblaApi?.scrollTo(index);
          }}
        />
      </div>
    </div>
  );
}
