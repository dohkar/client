"use client";

import { useMediaGallery } from "./useMediaGallery";
import { MediaGrid } from "./MediaGrid";
import { FullscreenViewer } from "./FullscreenViewer";
import type { MediaGalleryProps } from "./types";
import { cn } from "@/lib/utils/cn";

/**
 * Client-side реализация MediaGallery
 */
export function MediaGalleryClient({
  media,
  initialIndex = 0,
  className,
  aspectRatio = "16/9",
}: MediaGalleryProps) {
  const {
    isOpen,
    activeIndex,
    zoom,
    open,
    close,
    next,
    prev,
    setIndex,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useMediaGallery(media.length);

  const handleItemClick = (index: number) => {
    open(index);
  };

  return (
    <>
      <MediaGrid
        media={media}
        onItemClick={handleItemClick}
        aspectRatio={aspectRatio}
        className={className}
      />

      <FullscreenViewer
        media={media}
        isOpen={isOpen}
        activeIndex={activeIndex}
        zoom={zoom}
        onClose={close}
        onIndexChange={setIndex}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onDoubleClick={zoom === 1 ? zoomIn : resetZoom}
      />
    </>
  );
}
