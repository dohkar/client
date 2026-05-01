"use client";

import { MediaGrid } from "./MediaGrid";
import type { MediaGalleryProps } from "./types";

/**
 * Client-side реализация галереи медиа (hero + миниатюры + полноэкранный режим).
 */
export function MediaGalleryClient({
  media,
  initialIndex = 0,
  className,
  aspectRatio = "16/9",
  resetKey,
}: MediaGalleryProps) {
  const gridKey = resetKey ?? media.map((m) => m.id).join("|");
  return (
    <MediaGrid
      key={gridKey}
      media={media}
      initialIndex={initialIndex}
      aspectRatio={aspectRatio}
      className={className}
    />
  );
}
