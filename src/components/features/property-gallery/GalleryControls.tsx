"use client";

import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type GalleryControlsProps = {
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  canZoom?: boolean;
  showPrev: boolean;
  showNext: boolean;
  className?: string;
};

export function GalleryControls({
  onClose,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  canZoom = false,
  showPrev,
  showNext,
  className,
}: GalleryControlsProps) {
  return (
    <div className={cn("absolute inset-0 pointer-events-none z-10", className)}>
      {/* Кнопка закрытия */}
      <Button
        variant="secondary"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 pointer-events-auto rounded-full bg-background/90 backdrop-blur hover:bg-background shadow-lg min-h-[44px] min-w-[44px]"
        aria-label="Закрыть"
      >
        <X className="w-5 h-5" />
      </Button>

      {/* Кнопки навигации */}
      <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
        {showPrev && (
          <Button
            variant="secondary"
            size="icon"
            onClick={onPrev}
            className="pointer-events-auto rounded-full bg-background/90 backdrop-blur hover:bg-background shadow-lg min-h-[44px] min-w-[44px]"
            aria-label="Предыдущее"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        )}

        {showNext && (
          <Button
            variant="secondary"
            size="icon"
            onClick={onNext}
            className="pointer-events-auto rounded-full bg-background/90 backdrop-blur hover:bg-background shadow-lg min-h-[44px] min-w-[44px] ml-auto"
            aria-label="Следующее"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Кнопки zoom (только для изображений) */}
      {canZoom && (
        <div className="absolute bottom-20 right-4 flex flex-col gap-2 pointer-events-auto">
          {onZoomIn && (
            <Button
              variant="secondary"
              size="icon"
              onClick={onZoomIn}
              className="rounded-full bg-background/90 backdrop-blur hover:bg-background shadow-lg min-h-[44px] min-w-[44px]"
              aria-label="Увеличить"
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
          )}
          {onZoomOut && (
            <Button
              variant="secondary"
              size="icon"
              onClick={onZoomOut}
              className="rounded-full bg-background/90 backdrop-blur hover:bg-background shadow-lg min-h-[44px] min-w-[44px]"
              aria-label="Уменьшить"
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
