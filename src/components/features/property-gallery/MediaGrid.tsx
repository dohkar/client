import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { MediaItem, AspectRatio } from "./types";
import { MediaThumbnail } from "./MediaThumbnail";

type MediaGridProps = {
  media: MediaItem[];
  currentHeroIndex: number;
  onItemClick: (index: number) => void;
  onHeroPrev?: () => void;
  onHeroNext?: () => void;
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
  currentHeroIndex,
  onItemClick,
  onHeroPrev,
  onHeroNext,
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

  const heroItem = media[currentHeroIndex];
  const hasMore = media.length > 1;
  // Показываем thumbs, исключая текущий hero
  const thumbs = hasMore
    ? media
        .filter((_, index) => index !== currentHeroIndex)
        .slice(0, MAX_THUMBS)
    : [];
  const remainingCount = media.length > MAX_THUMBS + 1 ? media.length - (MAX_THUMBS + 1) : 0;

  // Явная проверка для случая с 2 элементами
  const isTwoItems = media.length === 2;
  const showNavigation = hasMore && (onHeroPrev || onHeroNext);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Hero изображение с навигацией */}
      <div className="relative group">
        <MediaThumbnail
          item={heroItem}
          index={currentHeroIndex}
          onClick={() => onItemClick(currentHeroIndex)}
          size="hero"
          className={cn("w-full", aspectRatioClasses[aspectRatio])}
        />

        {/* Кнопки навигации */}
        {showNavigation && (
          <div className="absolute inset-0 flex items-center justify-between p-2 sm:p-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {onHeroPrev && (
              <Button
                variant="secondary"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onHeroPrev();
                }}
                className="pointer-events-auto rounded-full bg-background/90 backdrop-blur hover:bg-background shadow-lg min-h-[44px] min-w-[44px]"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            )}

            {onHeroNext && (
              <Button
                variant="secondary"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onHeroNext();
                }}
                className="pointer-events-auto rounded-full bg-background/90 backdrop-blur hover:bg-background shadow-lg min-h-[44px] min-w-[44px] ml-auto"
                aria-label="Следующее фото"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            )}
          </div>
        )}
      </div>

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
            // Проверяем, является ли это последним видимым thumb и есть ли еще фото
            const visibleThumbsCount = thumbs.length;
            const totalAfterHero = media.length - 1; // Все фото кроме текущего hero
            const isLast = item === thumbs[visibleThumbsCount - 1] && totalAfterHero > visibleThumbsCount;

            return (
              <MediaThumbnail
                key={item.id}
                item={item}
                index={actualIndex}
                onClick={() => onItemClick(actualIndex)}
                size="thumb"
                className={cn(
                  isTwoItems ? "aspect-square" : "aspect-[5/3]",
                  "opacity-90 hover:opacity-100 transition-opacity",
                  actualIndex === currentHeroIndex && "ring-2 ring-primary opacity-100"
                )}
                showOverlay={isLast}
                overlayText={isLast ? `+${totalAfterHero - visibleThumbsCount}` : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
