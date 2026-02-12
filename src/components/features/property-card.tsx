"use client";

import type React from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";
import type { Property } from "@/types/property";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { ROUTES } from "@/constants";

interface PropertyCardProps {
  property: Property;
  hideFavoriteButton?: boolean;
}

export function PropertyCard({
  property,
  hideFavoriteButton = false,
}: PropertyCardProps) {
  const { isFavorite, toggleFavorite, isMutating } = useFavorites();

  const favorite = isFavorite(property.id);
  const isPending = isMutating(property.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(property.id, property);
  };
  const pricePerMeter = Math.round(property.price / property.area);

  return (
    <Link
      href={ROUTES.property(property.id, property.slug)}
      className='group w-full max-w-full mx-auto'
    >
      <div className='property-card h-full min-h-[410px] flex flex-col'>
        <div className='relative aspect-4/3 overflow-hidden bg-muted'>
          <Image
            src={property.image || "/placeholder.svg"}
            alt={property.title}
            fill
            className='object-cover group-hover:scale-105 transition-transform duration-300'
            sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
          />

          {/* Gradient Overlay */}
          <div className='absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />

          {/* Badges */}
          <div className='absolute top-3 left-3 flex gap-2 flex-wrap'>
            {property.isPremium && (
              <Badge className='badge-premium shadow-md'>⭐ Премиум</Badge>
            )}
          </div>

          {/* Favorite Button */}
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

        {/* Content */}
        <div className='p-2 sm:p-3 space-y-2 sm:space-y-3 flex-1 flex flex-col'>
          {/* Price */}
          <div className='space-y-1 flex justify-between items-center'>
            <p className='text-lg sm:text-xl font-bold text-primary'>
              {formatPrice(property.price, property.currency)}
            </p>
            <p className='text-xs sm:text-sm text-muted-foreground'>
              {formatPrice(pricePerMeter, property.currency)}/м²
            </p>
          </div>

          {/* Title */}
          <h3 className='font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug text-sm sm:text-base'>
            {property.title}
          </h3>

          {/* Address */}
          <div className='flex items-start gap-2 text-xs sm:text-sm text-muted-foreground flex-1'>
            <MapPin className='w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 shrink-0' />
            <span className='line-clamp-1'>{property.location}</span>
          </div>

          {/* Features */}
          <div className='flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground pt-3 border-t border-border mt-auto'>
            {property.rooms && (
              <span className='font-medium'>{property.rooms} комн.</span>
            )}
            {property.rooms && <span className='text-border'>•</span>}
            <span className='font-medium'>{property.area} м²</span>
            {property.floor && (
              <>
                <span className='text-border'>•</span>
                <span>{property.floor}</span>
              </>
            )}
            <span className='text-border'>•</span>
            <span className='text-muted-foreground'>
              {formatDate(property.datePosted, "ru-RU", { relative: true })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
