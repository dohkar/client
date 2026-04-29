"use client";

import Image from "next/image";
import type React from "react";
import { useMemo, useRef, useState } from "react";

function normalizeSources(sources: Array<string | null | undefined>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const src of sources) {
    const url = typeof src === "string" ? src.trim() : "";
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out.length > 0 ? out : ["/placeholder.svg"];
}

type ListingCardMediaProps = {
  title: string;
  image?: string | null;
  images?: string[] | null;
  className?: string;
};

export function ListingCardMedia({
  title,
  image,
  images,
  className,
}: ListingCardMediaProps) {
  const sources = useMemo(
    () =>
      normalizeSources([image, ...(Array.isArray(images) ? images : [])]).slice(0, 10),
    [image, images]
  );

  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef<number | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const didDragRef = useRef(false);

  const canSwipe = sources.length > 1;
  const widthPercent = 100 / sources.length;

  const visibleIndexes = useMemo(() => {
    const set = new Set<number>();
    set.add(index);
    set.add(Math.max(0, index - 1));
    set.add(Math.min(sources.length - 1, index + 1));
    return set;
  }, [index, sources.length]);

  const clampIndex = (next: number) => Math.max(0, Math.min(sources.length - 1, next));
  const goPrev = () => setIndex((prev) => clampIndex(prev - 1));
  const goNext = () => setIndex((prev) => clampIndex(prev + 1));

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canSwipe) return;
    activePointerIdRef.current = e.pointerId;
    startXRef.current = e.clientX;
    didDragRef.current = false;
    setIsDragging(true);
    // чтобы движения продолжали приходить даже если палец вышел за пределы
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canSwipe) return;
    if (activePointerIdRef.current !== e.pointerId) return;
    if (startXRef.current == null) return;

    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 4) didDragRef.current = true;
    setDragX(dx);
  };

  const finishDrag = () => {
    if (!canSwipe) return;
    setIsDragging(false);

    const thresholdPx = 40;
    const dx = dragX;
    setDragX(0);
    startXRef.current = null;
    activePointerIdRef.current = null;

    if (Math.abs(dx) < thresholdPx) return;
    setIndex((prev) => clampIndex(prev + (dx < 0 ? 1 : -1)));
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canSwipe) return;
    if (activePointerIdRef.current !== e.pointerId) return;
    finishDrag();
  };

  const onPointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canSwipe) return;
    if (activePointerIdRef.current !== e.pointerId) return;
    finishDrag();
  };

  return (
    <div
      className={[
        "relative h-full w-full select-none touch-pan-y",
        canSwipe ? "cursor-grab active:cursor-grabbing" : "",
        className ?? "",
      ].join(" ")}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClickCapture={(e) => {
        // если был свайп — не даём кликнуть и перейти по Link
        if (didDragRef.current) {
          e.preventDefault();
          e.stopPropagation();
          didDragRef.current = false;
        }
      }}
      aria-label={
        sources.length > 1 ? "Свайпните, чтобы листать фото" : "Фото объявления"
      }
    >
      <div className='absolute inset-0 overflow-hidden'>
        <div
          className='absolute inset-0 flex h-full w-full'
          style={{
            width: `${sources.length * 100}%`,
            transform: `translateX(calc(${-index * 100}% + ${dragX}px))`,
            transition: isDragging ? "none" : "transform 220ms ease-out",
          }}
        >
          {sources.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className='relative h-full'
              style={{ width: `${widthPercent}%` }}
            >
              {visibleIndexes.has(i) ? (
                <Image
                  src={src}
                  alt={i === 0 ? title : `${title} — фото ${i + 1}`}
                  fill
                  className='object-cover'
                  sizes='(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw'
                />
              ) : (
                // Пустая заглушка: сохраняем размеры, не грузим лишние изображения
                <div className='h-full w-full bg-muted' />
              )}
            </div>
          ))}
        </div>
      </div>

      {canSwipe && (
        <div className='pointer-events-none absolute inset-y-0 left-0 right-0 hidden items-center justify-between px-2 opacity-0 transition-opacity duration-150 md:flex md:group-hover:opacity-100'>
          <button
            type='button'
            className='pointer-events-auto grid size-11 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition-colors hover:bg-black/45 disabled:opacity-40'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goPrev();
            }}
            disabled={index === 0}
            aria-label='Предыдущее фото'
          >
            <span aria-hidden className='text-xl leading-none'>
              ‹
            </span>
          </button>
          <button
            type='button'
            className='pointer-events-auto grid size-11 place-items-center rounded-full bg-black/35 text-white backdrop-blur transition-colors hover:bg-black/45 disabled:opacity-40'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goNext();
            }}
            disabled={index === sources.length - 1}
            aria-label='Следующее фото'
          >
            <span aria-hidden className='text-xl leading-none'>
              ›
            </span>
          </button>
        </div>
      )}

      {canSwipe && (
        <div className='absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-black/35 px-2 py-1 backdrop-blur'>
          {sources.map((_, i) => (
            <span
              // eslint-disable-next-line react/no-array-index-key
              key={i}
              className={[
                "block h-1.5 w-1.5 rounded-full transition-all",
                i === index ? "bg-white" : "bg-white/45",
              ].join(" ")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
