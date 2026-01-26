import { cn } from "@/lib/utils/cn";
import type { MediaItem, AspectRatio } from "./types";
import { MediaThumbnail } from "./MediaThumbnail";

type MediaGridProps = {
  media: MediaItem[];
  onItemClick: (index: number) => void;
  aspectRatio?: AspectRatio;
  className?: string;
  emptyStateText?: string;
};

const aspectRatioClasses: Record<AspectRatio, string> = {
  "4/3": "aspect-[4/3]",
  "16/9": "aspect-video",
};

// Константы для конфигурации
const MAX_THUMBS = 4; // Максимальное количество thumbs для отображения

export function MediaGrid({
  media,
  onItemClick,
  aspectRatio = "16/9",
  className,
  emptyStateText = "Нет медиа",
}: MediaGridProps) {
  if (media.length === 0) {
    return (
      <div
        className={cn(
          "relative bg-muted rounded-xl overflow-hidden flex items-center justify-center",
          aspectRatioClasses[aspectRatio],
          className
        )}
      >
        <div className="text-muted-foreground text-sm">{emptyStateText}</div>
      </div>
    );
  }

  const heroItem = media[0];
  const hasMore = media.length > 1;
  const thumbs = hasMore ? media.slice(1, MAX_THUMBS + 1) : [];
  const remainingCount = media.length > MAX_THUMBS + 1 ? media.length - (MAX_THUMBS + 1) : 0;

  // Явная проверка для случая с 2 элементами
  const isTwoItems = media.length === 2;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Hero изображение */}
      <MediaThumbnail
        item={heroItem}
        index={0}
        onClick={() => onItemClick(0)}
        size="hero"
        className={cn(
          "w-full",
          aspectRatioClasses[aspectRatio]
        )}
      />

      {/* Compact thumbs strip */}
      {hasMore && (
        <div
          className={cn(
            "grid gap-2",
            isTwoItems
              ? "grid-cols-[120px] sm:grid-cols-[140px]"
              : "grid-cols-[repeat(auto-fit,minmax(0,1fr))]"
          )}
        >
          {thumbs.map((item) => {
            // Используем indexOf для надежного определения индекса
            const actualIndex = media.indexOf(item);
            const isLast = item === thumbs[thumbs.length - 1] && remainingCount > 0;

            return (
              <MediaThumbnail
                key={item.id}
                item={item}
                index={actualIndex}
                onClick={() => onItemClick(actualIndex)}
                size="thumb"
                className={cn(
                  isTwoItems ? "aspect-square" : "aspect-[5/3]",
                  "opacity-90 hover:opacity-100 transition-opacity"
                )}
                showOverlay={isLast}
                overlayText={isLast ? `+${remainingCount}` : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
