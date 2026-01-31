import { getOptimizedCloudinaryUrl } from "@/lib/cloudinary-url";
import type { MediaItem } from "./types";

/**
 * Преобразует массив строк (URL изображений) в MediaItem[]
 */
export function imagesToMediaItems(images: string[]): MediaItem[] {
  return images.map((src, index) => ({
    id: `image-${index}`,
    type: "image" as const,
    src,
    preview: getOptimizedCloudinaryUrl(src, { width: 100, quality: 60 }), // Маленький preview
    alt: `Изображение ${index + 1}`,
  }));
}

/**
 * Проверяет, является ли элемент изображением
 */
export function isImage(item: MediaItem): boolean {
  return item.type === "image";
}

/**
 * Проверяет, является ли элемент видео
 */
export function isVideo(item: MediaItem): boolean {
  return item.type === "video";
}

/**
 * Получает URL для отображения (preview для SSR, src для client)
 * Автоматически применяет Cloudinary оптимизацию
 */
export function getMediaUrl(item: MediaItem, usePreview = false): string {
  const url = usePreview && item.preview ? item.preview : item.src;
  // URL уже оптимизирован через cloudinary-loader в next/image
  return url;
}

/**
 * Получает alt текст для медиа
 */
export function getMediaAlt(item: MediaItem, index: number): string {
  return item.alt || `Медиа ${index + 1}`;
}
