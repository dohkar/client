import { memo, FC } from "react";
import { MediaGallery } from "./property-gallery/MediaGallery";
import { imagesToMediaItems } from "./property-gallery/utils";

type PropertyGalleryProps = {
  images?: string[];
};

/**
 * Обёртка для обратной совместимости.
 * Преобразует старый формат (string[]) в новый (MediaItem[]).
 */
const PropertyGallery: FC<PropertyGalleryProps> = ({ images }) => {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  const media = imagesToMediaItems(images);

  return <MediaGallery media={media} aspectRatio='16/9' />;
};

export default memo(PropertyGallery);
