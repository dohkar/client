/**
 * Custom image loader для Next.js Image с поддержкой Cloudinary трансформаций
 */

export interface CloudinaryLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Проверяет, является ли URL изображением из Cloudinary
 */
function isCloudinaryUrl(src: string): boolean {
  return src.includes("res.cloudinary.com") || src.includes("cloudinary.com");
}

/**
 * Генерирует оптимизированный URL для Cloudinary изображений
 */
export function cloudinaryLoader({ src, width, quality }: CloudinaryLoaderParams): string {
  // Локальные изображения (из /public) - возвращаем как есть
  if (src.startsWith("/") || src.startsWith("data:")) {
    return src;
  }

  // Если это не Cloudinary URL, возвращаем как есть
  if (!isCloudinaryUrl(src)) {
    return src;
  }

  // Парсим URL для извлечения частей
  const url = new URL(src);
  const pathParts = url.pathname.split("/");

  // Находим индекс 'upload' в пути
  const uploadIndex = pathParts.findIndex((part) => part === "upload");

  if (uploadIndex === -1) {
    // Если нет 'upload', возвращаем оригинальный URL
    return src;
  }

  // Формируем трансформации
  const transformations = [
    `w_${width}`, // ширина
    `q_${quality || "auto"}`, // качество (auto или заданное)
    "f_auto", // формат (auto - браузер выберет webp/avif)
    "c_limit", // crop mode - limit (не увеличивать, только уменьшать)
  ].join(",");

  // Вставляем трансформации после 'upload'
  const newPathParts = [
    ...pathParts.slice(0, uploadIndex + 1),
    transformations,
    ...pathParts.slice(uploadIndex + 1),
  ];

  url.pathname = newPathParts.join("/");

  return url.toString();
}
