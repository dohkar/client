import { API_URL } from "@/constants";
import { API_ENDPOINTS } from "@/constants/routes";
import { accessTokenStorage } from "@/lib/access-token-storage";

/**
 * Результат загрузки аватара
 */
export interface AvatarUploadResult {
  avatar: string;
}

/**
 * Результат загрузки изображений для объявления
 */
export interface ImagesUploadResult {
  images: Array<{
    url: string;
    publicId: string;
  }>;
}

export interface VideosUploadResult {
  videos: Array<{
    url: string;
    publicId: string;
  }>;
}

/**
 * Ошибка загрузки
 */
export interface UploadError {
  message: string;
  status: number;
}

/**
 * Допустимые MIME типы для загрузки
 */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm"];

/**
 * Максимальный размер файла (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_VIDEO_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Максимальное количество изображений для объявления
 */
export const MAX_IMAGES_PER_PROPERTY = 10;
export const MAX_VIDEOS_PER_PROPERTY = 3;

/**
 * Валидация файла перед загрузкой
 */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `Недопустимый формат файла. Разрешены: JPG, PNG, WebP`;
  }

  if (file.size > MAX_FILE_SIZE) {
    return `Размер файла превышает ${MAX_FILE_SIZE / 1024 / 1024}MB`;
  }

  return null;
}

/**
 * Валидация массива файлов
 */
export function validateImageFiles(files: File[]): string | null {
  if (files.length === 0) {
    return "Файлы не выбраны";
  }

  if (files.length > MAX_IMAGES_PER_PROPERTY) {
    return `Максимальное количество изображений: ${MAX_IMAGES_PER_PROPERTY}`;
  }

  for (const file of files) {
    const error = validateImageFile(file);
    if (error) return error;
  }

  return null;
}

export function validateVideoFile(file: File): string | null {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return "Недопустимый формат видео. Разрешены: MP4, WebM";
  }

  if (file.size > MAX_VIDEO_FILE_SIZE) {
    return `Размер видео превышает ${MAX_VIDEO_FILE_SIZE / 1024 / 1024}MB`;
  }

  return null;
}

export function validateVideoFiles(files: File[]): string | null {
  if (files.length === 0) {
    return "Видео не выбраны";
  }

  if (files.length > MAX_VIDEOS_PER_PROPERTY) {
    return `Максимальное количество видео: ${MAX_VIDEOS_PER_PROPERTY}`;
  }

  for (const file of files) {
    const error = validateVideoFile(file);
    if (error) return error;
  }

  return null;
}

/**
 * Сервис для загрузки изображений
 * Использует multipart/form-data для отправки файлов на сервер
 */
export const uploadService = {
  /**
   * Загрузка аватара пользователя
   * @param file - файл изображения
   * @returns URL загруженного аватара
   */
  async uploadAvatar(file: File): Promise<AvatarUploadResult> {
    const validationError = validateImageFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const formData = new FormData();
    formData.append("file", file);

    const accessToken = accessTokenStorage.getAccessToken();

    const response = await fetch(`${API_URL}${API_ENDPOINTS.upload.avatar}`, {
      method: "POST",
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка загрузки: ${response.status}`);
    }

    const json = await response.json();
    // API возвращает { status, data } - извлекаем data
    return json.data !== undefined ? json.data : json;
  },

  /**
   * Загрузка изображений для объявления
   * @param files - массив файлов изображений
   * @returns Массив URL и publicId загруженных изображений
   */
  async uploadPropertyImages(files: File[]): Promise<ImagesUploadResult> {
    const validationError = validateImageFiles(files);
    if (validationError) {
      throw new Error(validationError);
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const accessToken = accessTokenStorage.getAccessToken();

    const response = await fetch(`${API_URL}${API_ENDPOINTS.upload.images}`, {
      method: "POST",
      headers: {
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Ошибка загрузки: ${response.status}`);
    }

    const json = await response.json();
    // API возвращает { status, data } - извлекаем data
    return json.data !== undefined ? json.data : json;
  },

  async uploadPropertyVideos(files: File[]): Promise<VideosUploadResult> {
    const validationError = validateVideoFiles(files);
    if (validationError) {
      throw new Error(validationError);
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const accessToken = accessTokenStorage.getAccessToken();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90_000);

    try {
      const response = await fetch(`${API_URL}${API_ENDPOINTS.upload.videos}`, {
        method: "POST",
        headers: {
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: formData,
        credentials: "include",
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Ошибка загрузки: ${response.status}`);
      }

      const json = await response.json();
      return json.data !== undefined ? json.data : json;
    } finally {
      clearTimeout(timeout);
    }
  },
};
