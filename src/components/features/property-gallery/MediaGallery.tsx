import { MediaGalleryClient } from "./MediaGalleryClient";
import type { MediaGalleryProps } from "./types";

/**
 * Публичный компонент галереи медиа
 * Server-compatible - можно использовать в SSR
 */
export function MediaGallery(props: MediaGalleryProps) {
  return <MediaGalleryClient {...props} />;
}
