import type { MediaItem } from "./types";

/**
 * Преобразует массив строк (URL изображений) в MediaItem[]
 */
export function imagesToMediaItems(images: string[]): MediaItem[] {
  return images.map((src, index) => ({
    id: `image-${index}`,
    type: "image" as const,
    src,
    preview: src, // Для SSR используем тот же URL
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
 */
export function getMediaUrl(item: MediaItem, usePreview = false): string {
  if (usePreview && item.preview) {
    return item.preview;
  }
  return item.src;
}

/**
 * Получает alt текст для медиа
 */
export function getMediaAlt(item: MediaItem, index: number): string {
  return item.alt || `Медиа ${index + 1}`;
}

/** Циклический предыдущий индекс в галерее. */
export function getPrevIndex(current: number, length: number): number {
  return current > 0 ? current - 1 : length - 1;
}

/** Циклический следующий индекс в галерее. */
export function getNextIndex(current: number, length: number): number {
  return current < length - 1 ? current + 1 : 0;
}
