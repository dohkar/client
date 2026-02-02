import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MediaItem } from "./types";
import { getMediaUrl, getMediaAlt, isVideo } from "./utils";
import { memo, useCallback, KeyboardEvent } from "react";

// Добавим больше расширяемости для размеров превью
const sizeConfig = {
  hero: {
    minHeight: "min-h-[240px]",
    sizes: "100vw",
    imageQuality: 85,
  },
  thumb: {
    minHeight: "min-h-[120px]",
    sizes: "20vw",
    imageQuality: 60,
  },
  strip: {
    minHeight: "min-h-0",
    sizes: "96px",
    imageQuality: 60,
  },
} as const;

interface MediaThumbnailProps {
  item: MediaItem;
  index: number;
  onClick: () => void;
  size?: keyof typeof sizeConfig;
  lazy?: boolean;
  /** "blur" допустим только при наличии item.blurDataURL (для удалённых URL Next.js требует blurDataURL). */
  placeholder?: "blur" | "empty";
  className?: string;
}

export const MediaThumbnail = memo(function MediaThumbnail({
  item,
  index,
  onClick,
  size = "thumb",
  lazy = false,
  placeholder = "empty",
  className,
}: MediaThumbnailProps) {
  const isVideoItem = isVideo(item);
  const hasBlurData = !isVideoItem && item.blurDataURL;
  const effectivePlaceholder = placeholder === "blur" && hasBlurData ? "blur" : "empty";

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  // Улучшаем альт-текст для SEO и доступности
  const altText =
    getMediaAlt(item, index) || (isVideoItem ? "Видео превью" : "Фото недвижимости");

  const imageProps = {
    src: getMediaUrl(item, true),
    alt: altText,
    fill: true as const,
    className:
      "object-cover w-full h-full transition-transform duration-300 ease-in-out group-hover:scale-105",
    sizes: sizeConfig[size].sizes,
    priority: size === "hero",
    draggable: false,
    placeholder: effectivePlaceholder as "blur" | "empty",
    quality: sizeConfig[size]?.imageQuality,
    ...(effectivePlaceholder === "blur" && item.blurDataURL
      ? { blurDataURL: item.blurDataURL }
      : {}),
  };

  return (
    <div
      role='button'
      tabIndex={0}
      aria-label={altText}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative group overflow-hidden bg-neutral-200 focus:outline-none transition-shadow cursor-pointer select-none",
        size === "strip"
          ? "rounded-lg shadow-sm hover:shadow"
          : "rounded-xl shadow-md hover:shadow-xl",
        "aspect-[4/3]",
        sizeConfig[size].minHeight,
        className
      )}
      data-testid='media-thumbnail'
    >
      <Image {...imageProps} />

      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition",
          isVideoItem ? "bg-gradient-to-t from-black/40 via-transparent to-black/20" : ""
        )}
        aria-hidden='true'
      />

      {/* Видео иконка поверх превью */}
      {isVideoItem && (
        <div className='absolute inset-0 flex items-center justify-center z-10 pointer-events-none'>
          <span className='flex items-center justify-center rounded-full bg-white/95 shadow-lg border border-black/10 w-16 h-16 transition-transform group-hover:scale-110 group-active:scale-95 group-hover:bg-brand/95'>
            <Play
              className='h-8 w-8 text-primary'
              fill='currentColor'
              aria-label='Play video'
              focusable={false}
            />
          </span>
        </div>
      )}

      {/* Overlay для обратной связи при клике/тапе */}
      <span className='absolute inset-0 bg-black/7 opacity-0 group-active:opacity-100 group-focus:opacity-100 transition-opacity rounded-xl pointer-events-none' />

      {/* Добавим плавный фокус и outline для айтемов */}
      <span className='absolute inset-0 ring-primary/60 ring-2 opacity-0 group-focus:opacity-100 rounded-xl pointer-events-none transition-opacity' />

      {/* Доступное описание для скринридеров */}
      <span className='sr-only'>
        {isVideoItem ? "Видеозапись" : "Изображение"} {altText}
      </span>
    </div>
  );
});
