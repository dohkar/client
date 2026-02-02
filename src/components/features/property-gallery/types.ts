export type MediaItem = {
  id: string;
  type: "image" | "video";
  src: string;
  preview?: string; // для SSR и превью видео
  alt?: string;
  /** Data URL для blur-плейсхолдера (только для type: "image"). Next.js требует при placeholder="blur" для удалённых URL. */
  blurDataURL?: string;
};

export type AspectRatio = "4/3" | "16/9" | "1/1";

export type MediaGalleryProps = {
  media: MediaItem[];
  initialIndex?: number;
  className?: string;
  aspectRatio?: AspectRatio;
};
