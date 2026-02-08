import Image from "next/image";
import { Play, ImageOff } from "lucide-react";
import { memo, useState, useCallback, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import type { MediaItem } from "./types";
import { getMediaUrl, getMediaAlt, isVideo } from "./utils";

const SIZE_CONFIG = {
  hero: {
    minHeight: "min-h-[240px]",
    sizes: "100vw",
    imageQuality: 85,
    rounded: "rounded-xl",
    shadow: "shadow-md hover:shadow-xl",
    outline: "rounded-xl",
  },
  thumb: {
    minHeight: "min-h-[120px]",
    sizes: "20vw",
    imageQuality: 60,
    rounded: "rounded-xl",
    shadow: "shadow-md hover:shadow-xl",
    outline: "rounded-xl",
  },
  strip: {
    minHeight: "min-h-0",
    sizes: "96px",
    imageQuality: 60,
    rounded: "rounded-lg",
    shadow: "shadow-sm hover:shadow",
    outline: "rounded-lg",
  },
} as const;

type SizeKey = keyof typeof SIZE_CONFIG;

interface MediaThumbnailProps {
  item: MediaItem;
  index: number;
  onClick: () => void;
  size?: SizeKey;
  lazy?: boolean;
  placeholder?: "blur" | "empty";
  className?: string;
  /** Позволяет переопределять класс для иконки play */
  videoIconClassName?: string;
}

export const MediaThumbnail = memo(function MediaThumbnail({
  item,
  index,
  onClick,
  size = "thumb",
  lazy = false,
  placeholder = "empty",
  className,
  videoIconClassName,
}: MediaThumbnailProps) {
  const sizeProps = SIZE_CONFIG[size];
  const isVideoItem = isVideo(item);
  const hasBlurData = !isVideoItem && Boolean(item.blurDataURL);
  const effectivePlaceholder = placeholder === "blur" && hasBlurData ? "blur" : "empty";
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Альт-текст и aria-label
  const altText =
    getMediaAlt(item, index) || (isVideoItem ? "Видео превью" : "Фото недвижимости");
  const ariaLabel = `${isVideoItem ? "Видеозапись" : "Изображение"}: ${altText}`;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  const imageProps = {
    src: getMediaUrl(item, true),
    alt: altText,
    fill: true as const,
    className:
      "object-cover w-full h-full transition-transform duration-300 ease-in-out md:group-hover:scale-105",
    sizes: sizeProps.sizes,
    priority: size === "hero",
    draggable: false,
    placeholder: effectivePlaceholder as "blur" | "empty",
    quality: sizeProps.imageQuality,
    ...(effectivePlaceholder === "blur" && item.blurDataURL
      ? { blurDataURL: item.blurDataURL }
      : {}),
    onLoad: () => setIsLoading(false),
    onError: () => {
      setHasError(true);
      setIsLoading(false);
    },
    ...(lazy ? { loading: "lazy" as const } : {}),
  };

  if (hasError) {
    return (
      <div
        role='button'
        tabIndex={0}
        aria-label={ariaLabel}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative group overflow-hidden flex items-center justify-center bg-neutral-100 cursor-pointer select-none focus:outline-none",
          sizeProps.rounded,
          sizeProps.shadow,
          "aspect-4/3",
          sizeProps.minHeight,
          className
        )}
        data-testid={`media-thumbnail-${index}`}
      >
        <div className='flex flex-col items-center justify-center w-full h-full gap-1'>
          <ImageOff
            className='w-8 h-8 text-neutral-400 mx-auto mb-1'
            aria-hidden='true'
          />
          <span className='text-xs text-neutral-500 text-center'>
            Не удалось загрузить
          </span>
        </div>
        <span
          className={cn(
            "absolute inset-0 bg-black/7 opacity-0 group-active:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none",
            sizeProps.outline
          )}
        />
        <span
          className={cn(
            "absolute inset-0 ring-primary/60 ring-2 opacity-0 group-focus:opacity-100 pointer-events-none transition-opacity",
            sizeProps.outline
          )}
        />
      </div>
    );
  }

  return (
    <div
      role='button'
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative group overflow-hidden bg-neutral-200 focus:outline-none transition-shadow cursor-pointer select-none",
        sizeProps.rounded,
        sizeProps.shadow,
        "aspect-4/3",
        sizeProps.minHeight,
        className
      )}
      data-testid={`media-thumbnail-${index}`}
    >
      {isLoading && (
        <div className='absolute inset-0 bg-neutral-200 animate-pulse z-10' />
      )}

      <Image {...imageProps} />

      {/* Видео-оверлей, градиент сверху только для видео */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition",
          isVideoItem && "bg-gradient-to-t from-black/40 via-transparent to-black/20"
        )}
        aria-hidden='true'
      />

      {/* Иконка видео поверх превью */}
      {isVideoItem && (
        <div className='absolute inset-0 flex items-center justify-center z-20 pointer-events-none'>
          <span
            className={cn(
              "flex items-center justify-center rounded-full bg-white/95 shadow-lg border border-black/10 w-16 h-16 transition-all duration-200 group-hover:scale-110 group-active:scale-95 group-hover:bg-brand/95 md:group-hover:scale-100 md:group-hover:bg-white/95",
              videoIconClassName
            )}
          >
            <Play
              className={cn("h-8 w-8 text-primary", videoIconClassName)}
              fill='currentColor'
              aria-label='Play video'
              focusable={false}
            />
          </span>
        </div>
      )}

      {/* Overlay для обратной связи при клике/фокусе */}
      <span
        className={cn(
          "absolute inset-0 bg-black/7 opacity-0 group-active:opacity-100 group-focus:opacity-100 transition-opacity pointer-events-none",
          sizeProps.outline
        )}
      />

      <span
        className={cn(
          "absolute inset-0 ring-primary/60 ring-2 opacity-0 group-focus:opacity-100 pointer-events-none transition-opacity",
          sizeProps.outline
        )}
      />

      {/* Индикатор позиции для strip */}
      {size === "strip" && (
        <div className='absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded z-30 pointer-events-none select-none'>
          {index + 1}
        </div>
      )}
    </div>
  );
});
