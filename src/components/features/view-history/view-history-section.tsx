"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Heart } from "lucide-react";
import { useState } from "react";
import { useViewHistory } from "@/hooks/use-view-history";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ViewHistoryItem } from "@/lib/history/view-history";

export function ViewHistorySection() {
  const { items, isReady, remove, clear } = useViewHistory();

  if (!isReady || items.length === 0) return null;

  return (
    <section className="w-full" aria-label="Просмотренные объявления">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground">
          Вы смотрели
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={clear}
          className="text-xs text-muted-foreground hover:text-foreground h-auto py-1 px-2"
        >
          Очистить
        </Button>
      </div>

      <div
        className="
          flex gap-3
          overflow-x-auto -mx-4 px-4
          pb-2
          snap-x snap-mandatory
          [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
        "
        style={{ touchAction: "pan-x" }}
        aria-label="Просмотренные объявления"
      >
        {items.map((item) => (
          <ViewHistoryCard key={item.id} item={item} onRemove={remove} />
        ))}
      </div>
    </section>
  );
}

function ViewHistoryCard({
  item,
  onRemove,
}: {
  item: ViewHistoryItem;
  onRemove: (id: string) => void;
}) {
  const [liked, setLiked] = useState(false);

  return (
    <div className="relative group shrink-0 w-[160px] sm:w-[180px] snap-start">
      <Link
        href={item.href}
        className="
          flex flex-col rounded-xl overflow-hidden
          border border-border bg-card
          hover:shadow-md hover:-translate-y-0.5
          transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        "
      >
        <div className="relative w-full h-[110px] sm:h-[120px] overflow-hidden bg-muted">
          <Image
            src={item.imageUrl || "/placeholder.svg"}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 160px, 180px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setLiked((v) => !v);
            }}
            aria-label={
              liked ? "Убрать из избранного" : "Добавить в избранное"
            }
            className="
              absolute top-2 right-2
              w-7 h-7 rounded-full
              flex items-center justify-center
              bg-background/80 backdrop-blur-sm
              shadow-sm transition-all duration-150
              hover:scale-110
            "
          >
            <Heart
              className={cn(
                "h-3.5 w-3.5 transition-colors",
                liked ? "fill-red-500 text-red-500" : "text-muted-foreground"
              )}
            />
          </button>
        </div>

        <div className="p-2.5">
          <p className="text-sm font-bold text-foreground leading-tight">
            {item.price}
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-tight line-clamp-2">
            {item.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {item.address}
          </p>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => onRemove(item.id)}
        aria-label="Убрать из просмотренных"
        className="
          absolute top-2 left-2 z-10
          opacity-0 group-hover:opacity-100
          w-6 h-6 rounded-full
          flex items-center justify-center
          bg-background/80 backdrop-blur-sm
          text-muted-foreground hover:text-foreground
          shadow-sm transition-all duration-150
          hover:scale-110
        "
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
