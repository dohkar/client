"use client";

/**
 * Хук состояния для FullscreenViewer (open/close, index, zoom).
 * Не используется в текущей версии: галерея управляется состоянием внутри MediaGrid.
 */
import { useState, useEffect, useCallback, useRef } from "react";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

export function useMediaGallery(totalItems: number) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isZooming, setIsZooming] = useState(false);
  const bodyScrollLockRef = useRef(false);

  const open = useCallback(
    (index: number = 0) => {
      setActiveIndex(Math.max(0, Math.min(index, totalItems - 1)));
      setZoom(1);
      setIsZooming(false);
      setIsOpen(true);
    },
    [totalItems]
  );

  const close = useCallback(() => {
    setIsOpen(false);
    setZoom(1);
    setIsZooming(false);
  }, []);

  const next = useCallback(() => {
    setActiveIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex >= totalItems) return 0;
      return nextIndex;
    });
    setZoom(1);
    setIsZooming(false);
  }, [totalItems]);

  const prev = useCallback(() => {
    setActiveIndex((prev) => {
      const prevIndex = prev - 1;
      if (prevIndex < 0) return totalItems - 1;
      return prevIndex;
    });
    setZoom(1);
    setIsZooming(false);
  }, [totalItems]);

  const setIndex = useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(index, totalItems - 1));
      setActiveIndex(clampedIndex);
      setZoom(1);
      setIsZooming(false);
    },
    [totalItems]
  );

  const zoomIn = useCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.min(prev + ZOOM_STEP, MAX_ZOOM);
      setIsZooming(newZoom > MIN_ZOOM);
      return newZoom;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - ZOOM_STEP, MIN_ZOOM);
      setIsZooming(newZoom > MIN_ZOOM);
      return newZoom;
    });
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setIsZooming(false);
  }, []);

  // Блокировка скролла при открытии fullscreen
  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      bodyScrollLockRef.current = true;

      return () => {
        if (bodyScrollLockRef.current) {
          document.body.style.overflow = originalStyle;
          bodyScrollLockRef.current = false;
        }
      };
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          close();
          break;
        case "ArrowLeft":
          e.preventDefault();
          prev();
          break;
        case "ArrowRight":
          e.preventDefault();
          next();
          break;
        case "+":
        case "=":
          e.preventDefault();
          zoomIn();
          break;
        case "-":
          e.preventDefault();
          zoomOut();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close, prev, next, zoomIn, zoomOut]);

  // Обновляем isZooming при изменении zoom
  useEffect(() => {
    setIsZooming(zoom > MIN_ZOOM);
  }, [zoom]);

  return {
    isOpen,
    activeIndex,
    zoom,
    isZooming,
    open,
    close,
    next,
    prev,
    setIndex,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
