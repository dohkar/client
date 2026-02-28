"use client";

import { useCallback, useEffect, useState } from "react";
import {
  uploadService,
  validateImageFiles,
  validateVideoFiles,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE,
  MAX_IMAGES_PER_PROPERTY,
  ALLOWED_VIDEO_TYPES,
  MAX_VIDEO_FILE_SIZE,
  MAX_VIDEOS_PER_PROPERTY,
} from "@/services/upload.service";
import { generateId } from "./schema";
import { toast } from "sonner";

export interface ImagePreview {
  id: string;
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  uploadedPublicId?: string;
  isUploading: boolean;
  error?: string;
}

export interface VideoPreview {
  id: string;
  file: File;
  uploadedUrl?: string;
  uploadedPublicId?: string;
  isUploading: boolean;
  error?: string;
  name: string;
}

export const MEDIA_LIMITS = {
  maxImages: MAX_IMAGES_PER_PROPERTY,
  maxVideos: MAX_VIDEOS_PER_PROPERTY,
  allowedImageTypes: ALLOWED_IMAGE_TYPES,
  allowedVideoTypes: ALLOWED_VIDEO_TYPES,
  maxFileSizeMb: MAX_FILE_SIZE / 1024 / 1024,
  maxVideoSizeMb: MAX_VIDEO_FILE_SIZE / 1024 / 1024,
} as const;

export function usePropertyFormMedia(initialImages?: string[], initialVideos?: string[]) {
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [videoPreviews, setVideoPreviews] = useState<VideoPreview[]>([]);
  const [videosError, setVideosError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (initialImages && initialImages.length > 0) {
      setImagePreviews(
        initialImages.map((url, index) => ({
          id: `existing-${index}`,
          file: new File([], "existing"),
          previewUrl: url,
          uploadedUrl: url,
          isUploading: false,
        }))
      );
    }
  }, [initialImages?.length]);

  useEffect(() => {
    if (initialVideos && initialVideos.length > 0) {
      setVideoPreviews(
        initialVideos.map((url, index) => ({
          id: `existing-video-${index}`,
          file: new File([], "existing-video"),
          uploadedUrl: url,
          isUploading: false,
          name: `Видео ${index + 1}`,
        }))
      );
    }
  }, [initialVideos?.length]);

  const handleFilesSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      if (imagePreviews.length + files.length > MAX_IMAGES_PER_PROPERTY) {
        toast.error(`Максимум ${MAX_IMAGES_PER_PROPERTY} изображений`);
        return;
      }

      const validationError = validateImageFiles(files);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      const newPreviews: ImagePreview[] = files.map((file) => ({
        id: generateId(),
        file,
        previewUrl: URL.createObjectURL(file),
        isUploading: true,
      }));

      setImagePreviews((prev) => [...prev, ...newPreviews]);
      setImagesError(null);
      setIsUploading(true);

      try {
        const result = await uploadService.uploadPropertyImages(files);
        setImagePreviews((prev) =>
          prev.map((p) => {
            const fileIndex = newPreviews.findIndex((np) => np.id === p.id);
            if (fileIndex !== -1 && result.images[fileIndex]) {
              return {
                ...p,
                uploadedUrl: result.images[fileIndex].url,
                uploadedPublicId: result.images[fileIndex].publicId,
                isUploading: false,
              };
            }
            return p;
          })
        );
        toast.success(`Загружено ${files.length} фото`, { duration: 1400 });
      } catch (error) {
        setImagePreviews((prev) =>
          prev.map((p) => {
            const isNew = newPreviews.find((np) => np.id === p.id);
            if (isNew) {
              return {
                ...p,
                isUploading: false,
                error:
                  error instanceof Error ? error.message : "Ошибка загрузки изображения",
              };
            }
            return p;
          })
        );
        toast.error(error instanceof Error ? error.message : "Ошибка загрузки", {
          duration: 2200,
        });
      } finally {
        setIsUploading(false);
        event.target.value = "";
      }
    },
    [imagePreviews.length]
  );

  const removeImage = useCallback((id: string) => {
    setImagePreviews((prev) => {
      const toRemove = prev.find((p) => p.id === id);
      if (toRemove?.previewUrl && toRemove.file.size > 0) {
        URL.revokeObjectURL(toRemove.previewUrl);
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  const handleVideoFilesSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;

      if (videoPreviews.length + files.length > MAX_VIDEOS_PER_PROPERTY) {
        toast.error(`Максимум ${MAX_VIDEOS_PER_PROPERTY} видео`);
        return;
      }

      const validationError = validateVideoFiles(files);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      const newPreviews: VideoPreview[] = files.map((file) => ({
        id: generateId(),
        file,
        isUploading: true,
        name: file.name,
      }));

      setVideoPreviews((prev) => [...prev, ...newPreviews]);
      setVideosError(null);
      setIsUploading(true);

      try {
        const result = await uploadService.uploadPropertyVideos(files);
        setVideoPreviews((prev) =>
          prev.map((p) => {
            const fileIndex = newPreviews.findIndex((np) => np.id === p.id);
            if (fileIndex !== -1 && result.videos[fileIndex]) {
              return {
                ...p,
                uploadedUrl: result.videos[fileIndex].url,
                uploadedPublicId: result.videos[fileIndex].publicId,
                isUploading: false,
              };
            }
            return p;
          })
        );
        toast.success(`Загружено ${files.length} видео`, { duration: 1400 });
      } catch (error) {
        setVideoPreviews((prev) =>
          prev.map((p) => {
            const isNew = newPreviews.find((np) => np.id === p.id);
            if (!isNew) return p;
            return {
              ...p,
              isUploading: false,
              error: error instanceof Error ? error.message : "Ошибка загрузки видео",
            };
          })
        );
        toast.error(error instanceof Error ? error.message : "Ошибка загрузки видео");
      } finally {
        setIsUploading(false);
        event.target.value = "";
      }
    },
    [videoPreviews.length]
  );

  const removeVideo = useCallback((id: string) => {
    setVideoPreviews((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const setImagesErrorState = useCallback((msg: string | null) => {
    setImagesError(msg);
  }, []);

  return {
    imagePreviews,
    imagesError,
    setImagesError: setImagesErrorState,
    videoPreviews,
    videosError,
    isUploading,
    handleFilesSelect,
    removeImage,
    handleVideoFilesSelect,
    removeVideo,
  };
}
