import { memo, FC } from "react";
import { MediaGallery } from "./property-gallery/MediaGallery";
import { imagesToMediaItems } from "./property-gallery/utils";

type ListingGalleryProps = {
  images?: string[];
};

/**
 * Обёртка над `MediaGallery` для листингов.
 * Принимает старый формат `string[]` и приводит к `MediaItem[]`.
 */
const ListingGallery: FC<ListingGalleryProps> = ({ images }) => {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  const media = imagesToMediaItems(images);
  return <MediaGallery media={media} aspectRatio='16/9' />;
};

export default memo(ListingGallery);

