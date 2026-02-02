"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { MediaItem } from "./types";
import { getMediaUrl, getMediaAlt, isImage } from "./utils";
import { ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";

type MediaSlideProps = {
  item: MediaItem;
  index: number;
  zoom: number;
  isActive: boolean;
  onZoomChange: (zoom: number) => void;
  onDoubleClick?: () => void;
  onLoadingChange?: (loaded: boolean) => void;
  className?: string;
};

const MAX_PAN_OFFSET = 450;
const MIN_PAN_OFFSET = -450;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.35;
const DOUBLE_TAP_DELAY = 300; // ms

export function MediaSlide({
  item,
  index,
  zoom,
  isActive,
  className,
  onZoomChange,
  onDoubleClick,
  onLoadingChange,
}: MediaSlideProps) {
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Добавим состояние для лоадера и после fade-in
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFaded, setIsFaded] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouch = useRef<{ x: number; y: number } | null>(null);
  const lastTouchTime = useRef<number | null>(null); // Use ref for time

  const isImageItem = isImage(item);
  const canZoom = isImageItem && zoom > 1;

  // Fullscreen API support
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (typeof document.exitFullscreen === "function") {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Accessibility: Zoom In/Out toolbar
  const handleZoomIn = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    const nextZoom = Math.min(zoom + ZOOM_STEP, MAX_ZOOM);
    if (nextZoom !== zoom) {
      onZoomChange(nextZoom);
    }
  };

  const handleZoomOut = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation();
    const nextZoom = Math.max(zoom - ZOOM_STEP, MIN_ZOOM);
    if (nextZoom !== zoom) onZoomChange(nextZoom);
    if (nextZoom === 1) setPanOffset({ x: 0, y: 0 });
  };

  // Mouse Events for image panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canZoom) return;
    // Only left button
    if (e.button !== 0) return;
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canZoom || !panStart || !isDragging) return;
    // Prevent unwanted text selection
    e.preventDefault();
    setPanOffset((prev) => {
      const x = e.clientX - panStart.x;
      const y = e.clientY - panStart.y;
      return {
        x: Math.max(MIN_PAN_OFFSET, Math.min(MAX_PAN_OFFSET, x)),
        y: Math.max(MIN_PAN_OFFSET, Math.min(MAX_PAN_OFFSET, y)),
      };
    });
  };

  const handleMouseUp = () => {
    setPanStart(null);
    setIsDragging(false);
  };

  // Touch Events for image panning + double tap zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!canZoom) {
      // Handle double-tap to zoom for mobile if not zoomed in
      if (isImageItem && e.touches.length === 1) {
        // Only use Date.now in event handler and a ref
        // eslint-disable-next-line react-hooks/purity
        const now = Date.now();
        if (
          lastTouchTime.current &&
          now - lastTouchTime.current < DOUBLE_TAP_DELAY &&
          lastTouch.current
        ) {
          // Double tap detected
          handleDoubleClick(e);
          lastTouchTime.current = null;
          return;
        }
        lastTouchTime.current = now;
        lastTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      return;
    }
    const touch = e.touches[0];
    setPanStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canZoom || !panStart || !isDragging) return;
    if (e.touches.length !== 1) return;
    // Prevent browser scrolling when panning
    e.preventDefault();
    const touch = e.touches[0];
    setPanOffset((prev) => {
      const x = touch.clientX - panStart.x;
      const y = touch.clientY - panStart.y;
      return {
        x: Math.max(MIN_PAN_OFFSET, Math.min(MAX_PAN_OFFSET, x)),
        y: Math.max(MIN_PAN_OFFSET, Math.min(MAX_PAN_OFFSET, y)),
      };
    });
  };

  const handleTouchEnd = () => {
    setPanStart(null);
    setIsDragging(false);
  };

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isImageItem) return;
      e.preventDefault?.();
      e.stopPropagation?.();
      if (zoom === 1) {
        onZoomChange(2);
      } else {
        onZoomChange(1);
        setPanOffset({ x: 0, y: 0 });
      }
      onDoubleClick?.();
    },
    [isImageItem, zoom, onZoomChange, onDoubleClick]
  );

  // Keyboard zoom accessibility
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isActive) return;
      switch (e.key) {
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
        case "_":
          handleZoomOut();
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        case "Escape":
          onZoomChange(1);
          setPanOffset({ x: 0, y: 0 });
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line
  }, [isActive, zoom, isFullscreen]);

  // If zoom back to minimum, also reset pan
  useEffect(() => {
    if (zoom === 1 && (panOffset.x !== 0 || panOffset.y !== 0)) {
      setPanOffset({ x: 0, y: 0 });
    }
    // eslint-disable-next-line
  }, [zoom]);

  // Prevent unwanted text selection while dragging
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
    } else {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    }
    return () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging]);

  // Maintain pan offset bounds when zoom changes (prevents image "jumping" out of view)
  useEffect(() => {
    if (zoom === 1) {
      setPanOffset({ x: 0, y: 0 });
    } else {
      setPanOffset((prev) => ({
        x: Math.max(MIN_PAN_OFFSET, Math.min(MAX_PAN_OFFSET, prev.x)),
        y: Math.max(MIN_PAN_OFFSET, Math.min(MAX_PAN_OFFSET, prev.y)),
      }));
    }
  }, [zoom]);

  // Toolbar with more visible controls and fullscreen
  const Toolbar = useMemo(() => {
    if (!isImageItem) return null;
    return (
      <div className='absolute top-5 right-5 z-30 flex gap-2 bg-transparent'>
        <button
          className={cn(
            "rounded-full p-2 bg-white/90 hover:bg-white transition-all shadow-lg border border-gray-200 focus:outline-none",
            zoom === MIN_ZOOM ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
          )}
          onClick={handleZoomOut}
          tabIndex={0}
          aria-label='Уменьшить'
          disabled={zoom === MIN_ZOOM}
        >
          <ZoomOut className='text-gray-700' />
        </button>
        <button
          className={cn(
            "rounded-full p-2 bg-white/90 hover:bg-white transition-all shadow-lg border border-gray-200 focus:outline-none",
            zoom === MAX_ZOOM ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
          )}
          onClick={handleZoomIn}
          tabIndex={0}
          aria-label='Увеличить'
          disabled={zoom === MAX_ZOOM}
        >
          <ZoomIn className='text-gray-700' />
        </button>
        <button
          className={cn(
            "rounded-full p-2 bg-white/90 hover:bg-white transition-all shadow-lg border border-gray-200 focus:outline-none",
            isFullscreen ? "ring-2 ring-blue-600" : "cursor-pointer"
          )}
          onClick={toggleFullscreen}
          tabIndex={0}
          aria-label={isFullscreen ? "Выйти из полноэкранного режима" : "Во весь экран"}
        >
          {isFullscreen ? (
            <Minimize2 className='text-gray-700' />
          ) : (
            <Maximize2 className='text-gray-700' />
          )}
        </button>
      </div>
    );
  }, [isImageItem, zoom, isFullscreen]);

  // Hint overlay - better appearance
  const OverlayHint = useMemo(
    () =>
      canZoom && !isDragging ? (
        <div
          className='absolute bottom-4 inset-x-0 flex justify-center pointer-events-none z-20'
          aria-hidden
        >
          <div className='rounded-lg bg-black/75 text-sm text-white px-4 py-1.5 shadow-lg font-medium backdrop-blur'>
            Перетащите для панорамирования. Двойной клик/тап — сброс.{" "}
            <span className='hidden md:inline'>
              Колесо мыши — масштаб.{" "}
              <kbd className='bg-white bg-opacity-70 text-gray-700 px-1.5 py-0.5 rounded shadow-sm ml-2'>
                F
              </kbd>{" "}
              — полноэкранный режим.
            </span>
          </div>
        </div>
      ) : null,
    [canZoom, isDragging]
  );

  // Wheel event for zoom (desktop)
  useEffect(() => {
    const ref = containerRef.current;
    if (!ref || !isImageItem) return;

    const onWheel = (e: WheelEvent) => {
      // Only zoom if ctrl key or if panMode is enabled (image is zoomable)
      if (!isActive) return;
      if (Math.abs(e.deltaY) < 5) return;
      if (!canZoom && e.deltaY < 0) {
        handleZoomIn();
        return;
      }
      if (zoom > MIN_ZOOM || e.deltaY < 0) {
        if (e.deltaY < 0) {
          handleZoomIn();
        } else {
          handleZoomOut();
        }
      }
      e.preventDefault();
    };

    ref.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      ref.removeEventListener("wheel", onWheel);
    };
  }, [zoom, isActive, canZoom, isImageItem]);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    onLoadingChange?.(true);
    requestAnimationFrame(() => setIsFaded(true));
  }, [onLoadingChange]);

  // При смене слайда сбрасываем только локальное состояние. Родителю НЕ шлём "loading" —
  // иначе после быстрой загрузки из кеша effect перезаписывает "loaded" и спиннер снова включается.
  useEffect(() => {
    setIsLoading(true);
    setIsFaded(false);
  }, [item, index]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "w-full h-full bg-black relative overflow-hidden select-none transition-[background-color] duration-200",
        canZoom && isDragging
          ? "cursor-grabbing"
          : canZoom
            ? "cursor-grab"
            : isImageItem
              ? "cursor-zoom-in"
              : "cursor-pointer",
        className,
        isFullscreen && "z-50" // bring to front when fullscreen
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
      tabIndex={0}
      role='group'
      aria-label={isImageItem ? "Галерея изображений" : "Галерея видео"}
      style={{
        outline: isActive ? "2px solid hsl(var(--primary))" : undefined,
        backgroundColor: "hsl(var(--background) / 0.02)",
      }}
    >
      {Toolbar}
      {isImageItem ? (
        <>
          {/* Один индикатор загрузки — в MediaGrid; здесь только плавное появление картинки после onLoad */}
          <Image
            src={getMediaUrl(item, false)}
            alt={getMediaAlt(item, index)}
            fill
            draggable={false}
            className={cn(
              "object-contain transition-transform duration-300 ease-[cubic-bezier(.33,1,.68,1)] select-none pointer-events-auto",
              "transition-opacity duration-500",
              isFaded ? "opacity-100" : "opacity-0",
              isDragging && "pointer-events-none"
            )}
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              boxShadow: zoom > 1 ? "0 2px 20px 6px rgb(0 0 0 / 0.30)" : undefined,
              touchAction: canZoom ? "none" : "auto",
              userSelect: "none",
              willChange: canZoom ? "transform" : undefined,
              transition: [
                isDragging ? "none" : undefined,
                "opacity 0.5s",
                !isDragging && "transform 300ms cubic-bezier(.33,1,.68,1)",
              ]
                .filter(Boolean)
                .join(", "),
              cursor: canZoom && isDragging ? "grabbing" : canZoom ? "grab" : "zoom-in",
            }}
            priority={index < 3}
            sizes='(max-width: 1280px) 100vw, 1280px'
            onLoad={handleImageLoad}
            // Next.js v13+ native only triggers onLoad after decode, not before!
          />
        </>
      ) : (
        <div className='flex items-center justify-center w-full h-full bg-black'>
          <video
            src={getMediaUrl(item, false)}
            controls
            autoPlay={isActive}
            loop
            muted
            playsInline
            className='rounded-lg w-full h-full object-contain bg-black'
            style={{
              maxHeight: isFullscreen ? "100vh" : "96vh",
              backgroundColor: "#171923",
              outline: isActive ? "2px solid #3182ce" : undefined,
              transition: "box-shadow 0.2s, outline 0.2s",
            }}
          />
        </div>
      )}
      {OverlayHint}
    </div>
  );
}
