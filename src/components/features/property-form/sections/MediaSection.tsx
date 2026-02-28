"use client";

import { useRef, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SectionCard } from "../SectionCard";
import { Upload, X, ImageIcon, AlertCircle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import type { ImagePreview, VideoPreview } from "../use-media";
import { MEDIA_LIMITS } from "../use-media";

interface MediaSectionProps {
  imagePreviews: ImagePreview[];
  imagesError: string | null;
  onImagesSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
  videoPreviews: VideoPreview[];
  videosError: string | null;
  onVideosSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveVideo: (id: string) => void;
  isUploading: boolean;
}

export function MediaSection({
  imagePreviews,
  imagesError,
  onImagesSelect,
  onRemoveImage,
  videoPreviews,
  videosError,
  onVideosSelect,
  onRemoveVideo,
  isUploading,
}: MediaSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleSelectClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleVideoSelectClick = useCallback(() => {
    videoInputRef.current?.click();
  }, []);

  const canAddImages = imagePreviews.length < MEDIA_LIMITS.maxImages;
  const canAddVideos = videoPreviews.length < MEDIA_LIMITS.maxVideos;

  return (
    <>
      <SectionCard
        title="Фотографии"
        icon={
          <span className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <span className="text-sm font-normal text-muted-foreground">
              {imagePreviews.length} / {MEDIA_LIMITS.maxImages}
            </span>
          </span>
        }
      >
        <div
          role="button"
          tabIndex={0}
          onClick={canAddImages ? handleSelectClick : undefined}
          onKeyDown={(e) => {
            if (canAddImages && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              handleSelectClick();
            }
          }}
          className={`
            border-2 border-dashed rounded-lg p-4 text-center transition select-none
            ${canAddImages ? "cursor-pointer hover:border-primary/40 hover:bg-primary/5 border-muted-foreground/25 bg-muted/20" : "opacity-60 cursor-not-allowed border-muted-foreground/20 bg-muted/10"}
            ${imagesError ? "border-destructive/50 bg-destructive/5" : ""}
          `}
          aria-label="Добавить фотографии"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={MEDIA_LIMITS.allowedImageTypes.join(",")}
            multiple
            onChange={onImagesSelect}
            className="sr-only"
            disabled={!canAddImages}
            aria-hidden
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Spinner className="h-6 w-6 text-primary" />
              <span className="text-sm text-muted-foreground">Загрузка изображений…</span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-muted-foreground">
              <Upload className="h-5 w-5 shrink-0" />
              <span className="text-sm">
                {canAddImages
                  ? "Добавить фотографии"
                  : `Достигнут лимит (${MEDIA_LIMITS.maxImages})`}
              </span>
              <span className="text-xs opacity-70">
                JPG, PNG, WebP, до {MEDIA_LIMITS.maxFileSizeMb} МБ
              </span>
            </div>
          )}
        </div>

        {imagesError && (
          <div className="mt-2 flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {imagesError}
          </div>
        )}

        {imagePreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
            {imagePreviews.map((preview) => (
              <div
                key={preview.id}
                className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border bg-muted/30 group"
              >
                <img
                  src={preview.previewUrl}
                  alt=""
                  className={`w-full h-full object-cover ${preview.isUploading ? "blur-sm" : ""} ${preview.error ? "opacity-50 grayscale" : ""}`}
                />
                {(preview.isUploading || preview.error) && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    {preview.isUploading ? (
                      <Spinner className="h-6 w-6 text-white" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-destructive" />
                    )}
                  </div>
                )}
                {preview.uploadedUrl && !preview.isUploading && !preview.error && (
                  <div className="absolute top-1.5 left-1.5 h-5 w-5 rounded-full bg-green-500 flex items-center justify-center shadow">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full opacity-90 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => onRemoveImage(preview.id)}
                  disabled={preview.isUploading}
                  aria-label="Удалить фото"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {imagePreviews.length === 0 && !isUploading && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Добавьте хотя бы одно фото объявления
          </p>
        )}
      </SectionCard>

      <SectionCard
        title="Видео"
        icon={
          <span className="flex items-center gap-2">
            <span className="text-sm font-normal text-muted-foreground">
              {videoPreviews.length} / {MEDIA_LIMITS.maxVideos}
            </span>
          </span>
        }
      >
        <div
          role="button"
          tabIndex={0}
          onClick={canAddVideos ? handleVideoSelectClick : undefined}
          onKeyDown={(e) => {
            if (canAddVideos && (e.key === "Enter" || e.key === " ")) {
              e.preventDefault();
              handleVideoSelectClick();
            }
          }}
          className={`
            border-2 border-dashed rounded-lg py-3 px-4 text-center transition select-none
            ${canAddVideos ? "cursor-pointer hover:border-primary/40 hover:bg-primary/5 border-muted-foreground/25 bg-muted/20" : "opacity-60 cursor-not-allowed border-muted-foreground/20 bg-muted/10"}
            ${videosError ? "border-destructive/50 bg-destructive/5" : ""}
          `}
          aria-label="Добавить видео"
        >
          <input
            ref={videoInputRef}
            type="file"
            accept={MEDIA_LIMITS.allowedVideoTypes.join(",")}
            multiple
            onChange={onVideosSelect}
            className="sr-only"
            disabled={!canAddVideos}
            aria-hidden
          />
          <span className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4" />
            {canAddVideos
              ? `Добавить видео (MP4, WebM, до ${MEDIA_LIMITS.maxVideoSizeMb} МБ)`
              : `Лимит: ${MEDIA_LIMITS.maxVideos} видео`}
          </span>
        </div>

        {videosError && (
          <div className="mt-2 flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {videosError}
          </div>
        )}

        {videoPreviews.length > 0 && (
          <ul className="mt-3 space-y-2 max-h-28 overflow-auto">
            {videoPreviews.map((video) => (
              <li
                key={video.id}
                className="flex items-center gap-2 rounded-md border border-border bg-muted/20 px-3 py-2 text-sm"
              >
                <span className="truncate flex-1">
                  {video.uploadedUrl ? video.uploadedUrl.split("/").pop() : video.name}
                </span>
                {video.isUploading && <Spinner className="h-4 w-4 shrink-0" />}
                {video.error && (
                  <span className="text-xs text-destructive shrink-0">{video.error}</span>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => onRemoveVideo(video.id)}
                  disabled={video.isUploading}
                  aria-label="Удалить видео"
                >
                  <X className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </>
  );
}
