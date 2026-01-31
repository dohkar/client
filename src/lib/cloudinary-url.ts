/**
 * Утилиты для работы с Cloudinary URL
 */

/**
 * Проверяет, является ли URL изображением из Cloudinary
 */
export function isCloudinaryUrl(src: string): boolean {
  if (!src) return false;
  return src.includes("res.cloudinary.com") || src.includes("cloudinary.com");
}

/**
 * Генерирует оптимизированный Cloudinary URL с трансформациями
 * @param src - исходный URL изображения
 * @param options - опции трансформации
 */
export function getOptimizedCloudinaryUrl(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number | "auto";
    format?: "auto" | "webp" | "avif" | "jpg" | "png";
    crop?: "limit" | "fill" | "fit" | "scale";
  } = {}
): string {
  // Если это не Cloudinary URL, возвращаем как есть
  if (!isCloudinaryUrl(src)) {
    return src;
  }

  const {
    width,
    height,
    quality = "auto",
    format = "auto",
    crop = "limit",
  } = options;

  try {
    const url = new URL(src);
    const pathParts = url.pathname.split("/");

    // Находим индекс 'upload' в пути
    const uploadIndex = pathParts.findIndex((part) => part === "upload");

    if (uploadIndex === -1) {
      return src;
    }

    // Формируем трансформации
    const transformations: string[] = [];

    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    transformations.push(`q_${quality}`);
    transformations.push(`f_${format}`);
    transformations.push(`c_${crop}`);

    const transformationString = transformations.join(",");

    // Вставляем трансформации после 'upload'
    const newPathParts = [
      ...pathParts.slice(0, uploadIndex + 1),
      transformationString,
      ...pathParts.slice(uploadIndex + 1),
    ];

    url.pathname = newPathParts.join("/");

    return url.toString();
  } catch (error) {
    // Если не удалось распарсить URL, возвращаем оригинал
    return src;
  }
}

/**
 * Генерирует blur placeholder для изображения (низкое качество, маленький размер)
 */
export function getCloudinaryBlurUrl(src: string): string {
  return getOptimizedCloudinaryUrl(src, {
    width: 10,
    quality: 10,
    format: "jpg",
  });
}
