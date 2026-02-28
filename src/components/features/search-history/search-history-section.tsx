"use client";

import Link from "next/link";
import { X, Search } from "lucide-react";
import { useSearchHistory } from "@/hooks/use-search-history";
import { Button } from "@/components/ui/button";

export function SearchHistorySection() {
  const { items, isReady, remove, clear } = useSearchHistory();

  if (!isReady || items.length === 0) return null;

  return (
    <section className="w-full" aria-label="История поиска">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground">Вы искали</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={clear}
          className="text-xs text-muted-foreground hover:text-foreground h-auto py-1 px-2"
        >
          Очистить
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.id} className="relative group">
            <Link
              href={item.href}
              className="
                flex items-center gap-3 px-4 py-3 rounded-xl
                bg-card border border-border
                hover:border-primary/40 hover:shadow-sm
                transition-all duration-150
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
              "
            >
              <Search
                className="h-4 w-4 text-muted-foreground shrink-0"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.region}
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => remove(item.id)}
              aria-label={`Удалить "${item.label}" из истории`}
              className="
                absolute right-2 top-1/2 -translate-y-1/2
                opacity-0 group-hover:opacity-100
                w-6 h-6 rounded-full
                flex items-center justify-center
                text-muted-foreground hover:text-foreground
                bg-background/80 hover:bg-muted
                transition-all duration-150
              "
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
