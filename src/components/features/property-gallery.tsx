"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

interface PropertyGalleryProps {
  images: string[];
}

export function PropertyGallery({ images }: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!images || images.length === 0) {
    return (
      <div className="relative aspect-video md:aspect-[16/9] bg-muted rounded-xl overflow-hidden flex items-center justify-center">
        <ImageIcon className="w-12 h-12 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Основное изображение */}
      <div className="relative aspect-video md:aspect-[16/9] bg-muted rounded-xl overflow-hidden group">
        <Image
          src={images[activeIndex] || "/placeholder.svg"}
          alt={`Фото ${activeIndex + 1}`}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 80vw"
        />

        {/* Кнопки навигации */}
        <div className="absolute inset-0 flex items-center justify-between p-2 sm:p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-background/90 backdrop-blur hover:bg-background shadow-lg min-h-[44px] min-w-[44px]"
            onClick={prevImage}
            aria-label="Предыдущее фото"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-background/90 backdrop-blur hover:bg-background shadow-lg min-h-[44px] min-w-[44px]"
            onClick={nextImage}
            aria-label="Следующее фото"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Счетчик */}
        <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-2 backdrop-blur-sm shadow-lg">
          <ImageIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          {activeIndex + 1} / {images.length}
        </div>
      </div>

      {/* Миниатюры */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                activeIndex === index
                  ? "border-primary ring-2 ring-primary/30 shadow-md"
                  : "border-transparent hover:border-primary/50"
              )}
              aria-label={`Показать фото ${index + 1}`}
            >
              <Image
                src={image || "/placeholder.svg"}
                alt={`Миниатюра ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 25vw, 20vw"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
