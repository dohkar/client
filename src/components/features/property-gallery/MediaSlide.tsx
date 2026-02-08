"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  MouseEvent,
  KeyboardEvent as ReactKeyboardEvent,
  TouchEvent,
} from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { MediaItem, GalleryZoomLevel } from "./types";
import { GALLERY_CONFIG } from "./constants";
import { getMediaUrl, getMediaAlt, isImage } from "./utils";
import { ZoomIn, ZoomOut, ImageOff } from "lucide-react";

const { MAX_PAN_OFFSET, DOUBLE_TAP_DELAY_MS, WHEEL_DELTA_THRESHOLD } = GALLERY_CONFIG;
const MIN_PAN_OFFSET = -MAX_PAN_OFFSET;
const MIN_ZOOM: GalleryZoomLevel = 1;
const MAX_ZOOM: GalleryZoomLevel = 2;

interface MediaSlideProps {
  item: MediaItem;
  index: number;
  zoom: GalleryZoomLevel;
  isActive: boolean;
  onZoomChange: (zoom: GalleryZoomLevel) => void;
  onDoubleClick?: () => void;
  onLoadingChange?: (loaded: boolean, index?: number) => void;
  className?: string;
  "aria-busy"?: boolean;
}

export function MediaSlide({
  item,
  index,
  zoom,
  isActive,
  className,
  onZoomChange,
  onDoubleClick,
  onLoadingChange,
  "aria-busy": ariaBusy,
}: MediaSlideProps) {
  // state
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasError, setHasError] = useState(false);

  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const panWrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTouchTime = useRef<number | null>(null);
  const zoomRef = useRef<GalleryZoomLevel>(zoom);
  const panRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const wheelDeltaRef = useRef(0);
  const wheelRafRef = useRef<number | null>(null);
  const onLoadingChangeRef = useRef(onLoadingChange);
  const getNowRef = useRef<() => number>(() => Date.now());

  // context/derived
  const isImageItem = isImage(item);
  const canZoom = isImageItem && zoom > 1;

  // sync zoomRef with zoom
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  // sync callback ref
  useEffect(() => {
    onLoadingChangeRef.current = onLoadingChange;
  }, [onLoadingChange]);

  // pan style handler
  const applyPanStyle = useCallback(() => {
    const el = panWrapperRef.current;
    if (!el) return;
    const { x, y } = panRef.current;
    const z = zoomRef.current;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${z})`;
  }, []);

  // clamp pan on zoom change
  useEffect(() => {
    panRef.current.x = Math.max(
      MIN_PAN_OFFSET,
      Math.min(MAX_PAN_OFFSET, panRef.current.x)
    );
    panRef.current.y = Math.max(
      MIN_PAN_OFFSET,
      Math.min(MAX_PAN_OFFSET, panRef.current.y)
    );
    applyPanStyle();
  }, [zoom, applyPanStyle]);

  // reset pan/fade/error on src/index change
  useEffect(() => {
    panRef.current = { x: 0, y: 0 };
    applyPanStyle();
    const id = setTimeout(() => {
      setHasError(false);
    }, 0);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.src, index]);

  // video lifecycle mgmt
  useEffect(() => {
    if (isImageItem) return;
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      // Автостарт только если активен, не ловим ошибку
      video.play().catch(() => {});
    } else {
      video.pause();
    }
    return () => {
      video.pause();
    };
  }, [isActive, isImageItem]);

  // Zoom controls
  const handleZoomIn = useCallback(
    (e?: MouseEvent | ReactKeyboardEvent) => {
      e?.stopPropagation?.();
      if (zoom < MAX_ZOOM) {
        onZoomChange(MAX_ZOOM);
      }
    },
    [zoom, onZoomChange]
  );

  const handleZoomOut = useCallback(
    (e?: MouseEvent | ReactKeyboardEvent) => {
      e?.stopPropagation?.();
      if (zoom > MIN_ZOOM) {
        onZoomChange(MIN_ZOOM);
        panRef.current = { x: 0, y: 0 };
        applyPanStyle();
      }
    },
    [zoom, onZoomChange, applyPanStyle]
  );

  // Панорамирование мышью
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (!canZoom || e.button !== 0) return;
    setPanStart({
      x: e.clientX - panRef.current.x,
      y: e.clientY - panRef.current.y,
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!canZoom || !panStart) return;
    e.preventDefault();
    const x = Math.max(MIN_PAN_OFFSET, Math.min(MAX_PAN_OFFSET, e.clientX - panStart.x));
    const y = Math.max(MIN_PAN_OFFSET, Math.min(MAX_PAN_OFFSET, e.clientY - panStart.y));
    panRef.current = { x, y };
    applyPanStyle();
  };

  const stopDragging = () => {
    setPanStart(null);
    setIsDragging(false);
  };

  // Панорамирование touch, double-tap reset
  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (!canZoom) {
      if (isImageItem && e.touches.length === 1) {
        const now = getNowRef.current();
        if (
          lastTouchTime.current !== null &&
          now - lastTouchTime.current < DOUBLE_TAP_DELAY_MS
        ) {
          handleDoubleClick(e);
          lastTouchTime.current = null;
          return;
        }
        lastTouchTime.current = now;
      }
      return;
    }
    const touch = e.touches[0];
    setPanStart({
      x: touch.clientX - panRef.current.x,
      y: touch.clientY - panRef.current.y,
    });
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!canZoom || !panStart || e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    const x = Math.max(
      MIN_PAN_OFFSET,
      Math.min(MAX_PAN_OFFSET, touch.clientX - panStart.x)
    );
    const y = Math.max(
      MIN_PAN_OFFSET,
      Math.min(MAX_PAN_OFFSET, touch.clientY - panStart.y)
    );
    panRef.current = { x, y };
    applyPanStyle();
  };

  const handleTouchEnd = () => stopDragging();

  const handleDoubleClick = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isImageItem) return;
      e.preventDefault?.();
      e.stopPropagation?.();

      if (zoom === MIN_ZOOM) {
        onZoomChange(MAX_ZOOM);
      } else {
        onZoomChange(MIN_ZOOM);
        panRef.current = { x: 0, y: 0 };
        applyPanStyle();
      }
      onDoubleClick?.();
    },
    [zoom, isImageItem, onZoomChange, onDoubleClick, applyPanStyle]
  );

  // Keyboard controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
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
        case "Escape":
          if (zoomRef.current > MIN_ZOOM) {
            onZoomChange(MIN_ZOOM);
            panRef.current = { x: 0, y: 0 };
            applyPanStyle();
          }
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isActive, handleZoomIn, handleZoomOut, onZoomChange, applyPanStyle]);

  // Mouse wheel for zoom
  useEffect(() => {
    const ref = containerRef.current;
    if (!ref || !isImageItem) return;

    const onWheel = (e: WheelEvent) => {
      if (!isActive) return;
      if (Math.abs(e.deltaY) < WHEEL_DELTA_THRESHOLD) return;
      e.preventDefault();
      wheelDeltaRef.current += e.deltaY;

      if (wheelRafRef.current !== null) return;
      wheelRafRef.current = requestAnimationFrame(() => {
        wheelRafRef.current = null;
        const delta = wheelDeltaRef.current;
        wheelDeltaRef.current = 0;
        const current = zoomRef.current;
        if (delta < 0 && current < MAX_ZOOM) {
          onZoomChange(MAX_ZOOM);
        } else if (delta > 0 && current > MIN_ZOOM) {
          onZoomChange(MIN_ZOOM);
          panRef.current = { x: 0, y: 0 };
          applyPanStyle();
        }
      });
    };

    ref.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      ref.removeEventListener("wheel", onWheel);
      if (wheelRafRef.current !== null) {
        cancelAnimationFrame(wheelRafRef.current);
      }
    };
  }, [isActive, isImageItem, onZoomChange, applyPanStyle]);

  // блок скролла и млж блок для drag
  useEffect(() => {
    if (!isDragging) return;
    const prevUserSelect = document.body.style.userSelect;
    const prevCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
    return () => {
      document.body.style.userSelect = prevUserSelect;
      document.body.style.cursor = prevCursor;
    };
  }, [isDragging]);

  // loader callbacks
  const handleImageLoad = useCallback(() => {
    onLoadingChangeRef.current?.(true, index);
  }, [index]);

  const handleImageError = useCallback(() => {
    setHasError(true);
    onLoadingChangeRef.current?.(true, index);
  }, [index]);

  // Toolbar для zoom (image only)
  const Toolbar = useMemo(() => {
    if (!isImageItem) return null;
    return (
      <div className='absolute top-5 right-20 z-30 flex gap-2 bg-transparent'>
        <button
          type='button'
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
          type='button'
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
      </div>
    );
  }, [isImageItem, zoom, handleZoomIn, handleZoomOut]);

  // overlay hint
  const OverlayHint = useMemo(() => {
    if (!(canZoom && !isDragging)) return null;
    return (
      <div
        className='absolute bottom-4 inset-x-0 flex justify-center pointer-events-none z-20'
        aria-hidden
      >
        <div className='rounded-lg bg-black/75 text-sm text-white px-4 py-1.5 shadow-lg font-medium backdrop-blur'>
          Перетащите для панорамирования. Двойной клик/тап — сброс.
          <span className='hidden md:inline'> Колесо мыши — масштаб.</span>
        </div>
      </div>
    );
  }, [canZoom, isDragging]);

  // main render
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
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDragging}
      onMouseLeave={stopDragging}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
      tabIndex={0}
      role='group'
      aria-label={isImageItem ? "Галерея изображений" : "Галерея видео"}
      aria-busy={ariaBusy}
      style={{
        outline: isActive ? "2px solid hsl(var(--primary))" : undefined,
        backgroundColor: "hsl(var(--background) / 0.02)",
      }}
    >
      {Toolbar}
      {isImageItem ? (
        hasError ? (
          <div className='w-full h-full flex flex-col items-center justify-center gap-3 bg-neutral-950'>
            <ImageOff className='w-12 h-12 text-white/40' />
            <span className='text-white/80'>Ошибка загрузки</span>
            <button
              type='button'
              className='rounded px-3 py-1 bg-white/90 text-gray-700 hover:bg-white font-medium text-sm transition-all border border-gray-200 shadow focus:outline-none'
              onClick={() => {
                setHasError(false);
              }}
            >
              Повторить
            </button>
          </div>
        ) : (
          <div
            ref={panWrapperRef}
            className='absolute inset-0 transition-transform duration-300 ease-[cubic-bezier(.33,1,.68,1)]'
            style={{
              boxShadow: zoom > 1 ? "0 2px 20px 6px rgb(0 0 0 / 0.30)" : undefined,
              touchAction: canZoom ? "none" : "auto",
              userSelect: "none",
              willChange: isDragging ? "transform" : undefined,
              pointerEvents: isDragging ? "none" : "auto",
            }}
          >
            <Image
              src={getMediaUrl(item, false)}
              alt={getMediaAlt(item, index)}
              fill
              draggable={false}
              className={cn("object-contain select-none pointer-events-auto")}
              priority={index < 3}
              sizes='(max-width: 1280px) 100vw, 1280px'
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </div>
        )
      ) : (
        <div className='flex items-center justify-center w-full h-full bg-black'>
          <video
            ref={videoRef}
            src={getMediaUrl(item, false)}
            controls
            loop
            muted
            playsInline
            className='rounded-lg w-full h-full object-contain bg-black'
            style={{
              maxHeight: "96vh",
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
