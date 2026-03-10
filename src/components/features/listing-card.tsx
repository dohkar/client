"use client";

import type React from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Listing } from "@/types/listing";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { ROUTES } from "@/constants";
import { useFavorites } from "@/hooks/use-favorites";

interface ListingCardProps {
  listing: Listing;
  /** Скрыть кнопку избранного (например на странице «Избранное»). */
  hideFavoriteButton?: boolean;
}

export function ListingCard({ listing, hideFavoriteButton = false }: ListingCardProps) {
  const { isFavorite, toggleListingFavorite, isMutating } = useFavorites();
  const favorite = isFavorite(listing.id);
  const isPending = isMutating(listing.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleListingFavorite(listing.id, listing);
  };

  const image = listing.image || listing.images[0] || "/placeholder.svg";

  return (
    <Link
      href={ROUTES.listing(listing.id, listing.slug)}
      className="group w-full max-w-full mx-auto"
    >
      <div className="property-card h-full min-h-[410px] flex flex-col">
        <div className="relative aspect-4/3 overflow-hidden bg-muted">
          <Image
            src={image}
            alt={listing.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="absolute top-3 left-3 flex gap-2 flex-wrap">
            {listing.promotionTier === "BOOSTED" && (
              <Badge className="badge-premium shadow-md">Топ</Badge>
            )}
          </div>

          {!hideFavoriteButton && (
            <Button
              size="icon"
              variant="secondary"
              className={`absolute top-3 right-3 rounded-full backdrop-blur transition-all shadow-md min-h-[44px] min-w-[44px] ${
                favorite
                  ? "bg-destructive text-white hover:bg-destructive/90"
                  : "bg-background/90 hover:bg-background"
              } ${isPending ? "opacity-70" : ""}`}
              onClick={handleFavoriteClick}
              disabled={isPending}
              aria-label={favorite ? "Удалить из избранного" : "Добавить в избранное"}
            >
              <Heart
                className={`w-4 h-4 transition-transform ${favorite ? "fill-current scale-110" : ""} ${isPending ? "animate-pulse" : ""}`}
              />
            </Button>
          )}
        </div>

        <div className="p-2 sm:p-3 space-y-2 sm:space-y-3 flex-1 flex flex-col">
          <div className="space-y-1 flex justify-between items-center">
            <p className="text-lg sm:text-xl font-bold text-primary">
              {formatPrice(listing.price, listing.currency)}
            </p>
          </div>

          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug text-sm sm:text-base">
            {listing.title}
          </h3>

          <div className="flex items-start gap-2 text-xs sm:text-sm text-muted-foreground flex-1">
            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 shrink-0" />
            <span className="line-clamp-1">
              {listing.location || listing.city || listing.region || "Локация не указана"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-muted-foreground pt-3 border-t border-border mt-auto">
            {listing.previewAttributes.length > 0 ? (
              listing.previewAttributes.slice(0, 3).map((attr) => (
                <span key={attr} className="inline-flex items-center gap-1">
                  {attr}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground">
                Обновлено{" "}
                {formatDate(listing.updatedAt, "ru-RU", { relative: true })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

