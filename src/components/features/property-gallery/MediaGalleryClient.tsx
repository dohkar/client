"use client";

import { useState } from "react";
import { useMediaGallery } from "./useMediaGallery";
import { MediaGrid } from "./MediaGrid";
import { FullscreenViewer } from "./FullscreenViewer";
import type { MediaGalleryProps } from "./types";

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

  // Состояние для текущего hero изображения на странице
  const [currentHeroIndex, setCurrentHeroIndex] = useState(initialIndex);

  const handleItemClick = (index: number) => {
    // При клике на thumb обновляем hero индекс
    setCurrentHeroIndex(index);
    // Открываем fullscreen
    open(index);
  };

  const handleHeroPrev = () => {
    const newIndex = currentHeroIndex > 0 ? currentHeroIndex - 1 : media.length - 1;
    setCurrentHeroIndex(newIndex);
  };

  const handleHeroNext = () => {
    const newIndex = currentHeroIndex < media.length - 1 ? currentHeroIndex + 1 : 0;
    setCurrentHeroIndex(newIndex);
  };

  return (
    <>
      <MediaGrid
        media={media}
        currentHeroIndex={currentHeroIndex}
        onItemClick={handleItemClick}
        onHeroPrev={media.length > 1 ? handleHeroPrev : undefined}
        onHeroNext={media.length > 1 ? handleHeroNext : undefined}
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
