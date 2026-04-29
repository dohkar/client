"use client";

import type React from "react";
import Link from "next/link";
import { MapPin, Heart, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Listing } from "@/types/listing";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { ROUTES } from "@/constants";
import { useFavorites } from "@/hooks/use-favorites";
import { stripPostalCodePrefix, getRegionLabel } from "@/lib/ui/location";
import { ListingCardMedia } from "./listing-card-media";

interface ListingCardProps {
  listing: Listing;
  /** Скрыть кнопку избранного (например на странице «Избранное»). */
  hideFavoriteButton?: boolean;
  /** Вариант отображения: компактный для каруселей/похожих объявлений. */
  variant?: "default" | "compact";
}

export function ListingCard({
  listing,
  hideFavoriteButton = false,
  variant = "default",
}: ListingCardProps) {
  const { isFavorite, toggleFavorite, isMutating } = useFavorites();
  const favorite = isFavorite(listing.id);
  const isPending = isMutating(listing.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(listing.id, listing);
  };

  const isCompact = variant === "compact";
  const locationTextRaw = listing.location || listing.city || listing.region || "";
  const locationText = locationTextRaw
    ? stripPostalCodePrefix(
        listing.location
          ? String(listing.location)
          : listing.city
            ? String(listing.city)
            : (getRegionLabel(listing.region) ?? String(listing.region ?? ""))
      )
    : "Локация не указана";

  return (
    <Link
      href={ROUTES.listing(listing.id, listing.slug)}
      className='group block w-full max-w-full mx-auto focus:outline-none'
    >
      <div
        className={[
          "relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
          "transition-shadow duration-200 hover:shadow-md",
          "focus-within:ring-2 focus-within:ring-primary/30",
          isCompact ? "min-h-[320px]" : "min-h-[420px]",
        ].join(" ")}
      >
        <div className='relative aspect-4/3 overflow-hidden bg-muted'>
          <ListingCardMedia
            title={listing.title}
            image={listing.image}
            images={listing.images}
            className='absolute inset-0'
          />

          <div className='absolute inset-0 bg-linear-to-t from-black/45 via-black/5 to-transparent opacity-100' />

          <div className='absolute top-3 left-3 flex gap-2 flex-wrap'>
            {listing.promotionTier === "BOOSTED" && (
              <Badge className='shadow-sm bg-primary text-primary-foreground'>
                <Sparkles className='mr-1 h-3.5 w-3.5' />
                Топ
              </Badge>
            )}
          </div>

          {!hideFavoriteButton && (
            <Button
              size='icon'
              variant='secondary'
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

        <div
          className={
            isCompact
              ? "p-3 space-y-2 flex-1 flex flex-col"
              : "p-4 sm:p-5 space-y-3 flex-1 flex flex-col"
          }
        >
          <div className='flex items-start justify-between gap-3'>
            <p
              className={
                isCompact
                  ? "text-[1.05rem] font-extrabold leading-none"
                  : "text-xl sm:text-2xl font-extrabold leading-none"
              }
            >
              {formatPrice(listing.price, listing.currency)}
            </p>
            <span className='text-xs text-muted-foreground shrink-0 pt-0.5'>
              {formatDate(listing.updatedAt, "ru-RU", { relative: true })}
            </span>
          </div>

          <h3
            className={
              isCompact
                ? "font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug text-sm"
                : "font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug text-base"
            }
          >
            {listing.title}
          </h3>

          <div className='flex items-start gap-2 text-xs sm:text-sm text-muted-foreground'>
            <MapPin
              className={
                isCompact ? "w-3.5 h-3.5 mt-0.5 shrink-0" : "w-4 h-4 mt-0.5 shrink-0"
              }
            />
            <span className='min-w-0 line-clamp-1 wrap-break-word'>{locationText}</span>
          </div>

          <div
            className={
              isCompact
                ? "mt-auto pt-2.5 border-t border-border/70"
                : "mt-auto pt-3 border-t border-border/70"
            }
          >
            {listing.previewAttributes.length > 0 ? (
              <div className='flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
                {listing.previewAttributes.slice(0, isCompact ? 2 : 3).map((attr) => (
                  <span
                    key={attr}
                    className='inline-flex items-center rounded-full bg-muted px-2 py-0.5'
                  >
                    {attr}
                  </span>
                ))}
              </div>
            ) : (
              <span className='text-xs text-muted-foreground'>
                Объявление без параметров
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
