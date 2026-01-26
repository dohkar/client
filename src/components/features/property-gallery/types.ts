export type MediaItem = {
  id: string;
  type: "image" | "video";
  src: string;
  preview?: string; // для SSR и превью видео
  alt?: string;
};

export type AspectRatio = "4/3" | "16/9";

export type MediaGalleryProps = {
  media: MediaItem[];
  initialIndex?: number;
  className?: string;
  aspectRatio?: AspectRatio;
};
