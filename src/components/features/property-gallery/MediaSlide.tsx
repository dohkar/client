"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import type { MediaItem } from "./types";
import { getMediaUrl, getMediaAlt, isImage } from "./utils";

type MediaSlideProps = {
  item: MediaItem;
  index: number;
  zoom: number;
  isActive: boolean;
  onZoomChange?: (zoom: number) => void;
  onDoubleClick?: () => void;
};

export function MediaSlide({
  item,
  index,
  zoom,
  isActive,
  onZoomChange,
  onDoubleClick,
}: MediaSlideProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const isImageItem = isImage(item);
  const canZoom = isImageItem && zoom > 1;

  // Сброс pan при смене слайда или zoom
  useEffect(() => {
    if (!isActive || zoom === 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [isActive, zoom]);

  // Обработка pan при zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canZoom) return;
    e.preventDefault();
    setPanStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canZoom || !panStart) return;
    e.preventDefault();
    setPanOffset({
      x: e.clientX - panStart.x,
      y: e.clientY - panStart.y,
    });
  };

  const handleMouseUp = () => {
    setPanStart(null);
  };

  // Touch events для mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!canZoom) return;
    const touch = e.touches[0];
    setPanStart({
      x: touch.clientX - panOffset.x,
      y: touch.clientY - panOffset.y,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canZoom || !panStart) return;
    const touch = e.touches[0];
    setPanOffset({
      x: touch.clientX - panStart.x,
      y: touch.clientY - panStart.y,
    });
  };

  // Touch double tap для mobile zoom
  const touchTapRef = useRef(0);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isImageItem) {
      setPanStart(null);
      return;
    }

    const currentTime = Date.now();
    const timeSinceLastTap = currentTime - touchTapRef.current;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double tap detected
      e.preventDefault();
      if (onDoubleClick) {
        onDoubleClick();
      }
      touchTapRef.current = 0;
    } else {
      touchTapRef.current = currentTime;
      setPanStart(null);
    }
  };

  // Double tap для zoom на mobile
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!isImageItem) return;
    e.preventDefault();
    e.stopPropagation();
    if (onDoubleClick) {
      onDoubleClick();
    }
  };

  // Ограничение pan в пределах изображения
  const getBoundedOffset = () => {
    if (!containerRef.current || !imageContainerRef.current || !canZoom) {
      return { x: 0, y: 0 };
    }

    const container = containerRef.current;
    const imageContainer = imageContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const imageRect = imageContainer.getBoundingClientRect();

    const maxX = Math.max(0, (imageRect.width * zoom - containerRect.width) / 2);
    const maxY = Math.max(0, (imageRect.height * zoom - containerRect.height) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, panOffset.x)),
      y: Math.max(-maxY, Math.min(maxY, panOffset.y)),
    };
  };

  const boundedOffset = getBoundedOffset();

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <div className="text-muted-foreground text-sm">Ошибка загрузки</div>
      </div>
    );
  }

  if (item.type === "video") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <video
          src={item.src}
          controls
          autoPlay={isActive}
          className="w-full h-full object-contain"
          onLoadedData={() => setIsLoading(false)}
          onError={() => setError(true)}
          playsInline
        />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-white text-sm">Загрузка...</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-black relative overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
    >
      <div
        ref={imageContainerRef}
        className={cn(
          "relative transition-transform duration-200 ease-out",
          canZoom && "cursor-move"
        )}
        style={{
          transform: `scale(${zoom}) translate(${boundedOffset.x / zoom}px, ${boundedOffset.y / zoom}px)`,
        }}
      >
        <Image
          src={getMediaUrl(item, false)}
          alt={getMediaAlt(item, index)}
          width={1920}
          height={1080}
          className={cn(
            "object-contain",
            canZoom ? "cursor-move" : "cursor-zoom-in",
            isLoading && "opacity-0"
          )}
          priority={index === 0}
          loading={index === 0 ? "eager" : "lazy"}
          sizes="100vw"
          onLoad={() => setIsLoading(false)}
          onError={() => setError(true)}
        />
      </div>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <div className="text-white text-sm">Загрузка...</div>
        </div>
      )}
    </div>
  );
}
