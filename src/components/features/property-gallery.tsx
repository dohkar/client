import { MediaGallery } from "./property-gallery/MediaGallery";
import { imagesToMediaItems } from "./property-gallery/utils";

interface PropertyGalleryProps {
  images: string[];
}

/**
 * Обёртка для обратной совместимости
 * Преобразует старый формат (string[]) в новый (MediaItem[])
 */
export function PropertyGallery({ images }: PropertyGalleryProps) {
  if (!images || images.length === 0) {
    return null;
  }

  const media = imagesToMediaItems(images);

  return <MediaGallery media={media} aspectRatio="16/9" />;
}
