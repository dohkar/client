"use client";

/**
 * Полоска миниатюр для FullscreenViewer.
 * В MediaGrid используется встроенная полоска с MediaThumbnail.
 */
import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaItem } from "./types";
import { getMediaUrl, getMediaAlt, isVideo } from "./utils";

type GalleryThumbsProps = {
  media: MediaItem[];
  activeIndex: number;
  onThumbClick: (index: number) => void;
  className?: string;
};

export function GalleryThumbs({
  media,
  activeIndex,
  onThumbClick,
  className,
}: GalleryThumbsProps) {
  if (media.length <= 1) return null;

  return (
    <div
      className={cn(
        "absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-4 overflow-x-auto",
        // Добавляем отступ снизу для мобильной навигации (h-16 = 64px + safe area)
        "pb-20 md:pb-4",
        className
      )}
    >
      <div className='flex gap-2 justify-center max-w-4xl mx-auto'>
        {media.map((item, index) => {
          const isActive = index === activeIndex;
          const isVideoItem = isVideo(item);

          return (
            <button
              key={item.id}
              onClick={() => onThumbClick(index)}
              className={cn(
                "relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border-2 transition-all",
                isActive
                  ? "border-primary shadow-lg scale-105"
                  : "border-transparent hover:border-primary/50 opacity-70 hover:opacity-100"
              )}
              aria-label={`Показать ${getMediaAlt(item, index)}`}
              aria-current={isActive ? "true" : undefined}
            >
              {isVideoItem ? (
                <>
                  <Image
                    src={getMediaUrl(item, true)}
                    alt={getMediaAlt(item, index)}
                    fill
                    className='object-cover'
                    sizes='96px'
                  />
                  <div className='absolute inset-0 flex items-center justify-center bg-black/30'>
                    <Play className='w-6 h-6 text-white' fill='currentColor' />
                  </div>
                </>
              ) : (
                <Image
                  src={getMediaUrl(item, true)}
                  alt={getMediaAlt(item, index)}
                  fill
                  className='object-cover'
                  sizes='96px'
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
