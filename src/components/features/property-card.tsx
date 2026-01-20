"use client";

import type React from "react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin } from "lucide-react";
import { useFavoritesStore } from "@/stores";
import { useAuthStore } from "@/stores";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { favoritesService } from "@/services/favorites.service";
import { queryKeys } from "@/lib/react-query/query-keys";
import type { Property } from "@/types/property";
import { formatPrice, formatDate } from "@/lib/utils/format";
import { toast } from "sonner";

interface PropertyCardProps {
  property: Property;
  hideFavoriteButton?: boolean;
}

export function PropertyCard({
  property,
  hideFavoriteButton = false,
}: PropertyCardProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const queryClient = useQueryClient();
  const { isFavorite: isLocalFavorite, toggleFavorite: toggleLocalFavorite } =
    useFavoritesStore();

  // Проверяем, есть ли в избранном на сервере
  const { data: favorites } = useQuery({
    queryKey: queryKeys.favorites.all,
    queryFn: async () => {
      const response = await favoritesService.getFavorites();
      return response || [];
    },
    enabled: isAuthenticated,
  });

  const isServerFavorite = favorites?.some((fav) => fav.id === property.id) || false;
  const favorite = isAuthenticated ? isServerFavorite : isLocalFavorite(property.id);

  const addMutation = useMutation({
    mutationFn: () => favoritesService.addFavorite(property.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
      toast.success("Добавлено в избранное");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка добавления в избранное");
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => favoritesService.removeFavorite(property.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
      toast.success("Удалено из избранного");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка удаления из избранного");
    },
  });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toggleLocalFavorite(property.id);
      return;
    }

    if (favorite) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };
  const pricePerMeter = Math.round(property.price / property.area);

  return (
    <Link href={`/property/${property.id}`} className='group'>
      <div className='property-card h-full flex flex-col'>
        <div className='relative aspect-[4/3] overflow-hidden bg-muted'>
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
              }`}
              onClick={handleFavoriteClick}
              aria-label={favorite ? "Удалить из избранного" : "Добавить в избранное"}
            >
              <Heart className={`w-4 h-4 ${favorite ? "fill-current" : ""}`} />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className='p-4 sm:p-5 space-y-2 sm:space-y-3 flex-1 flex flex-col'>
          {/* Price */}
          <div className='space-y-1'>
            <p className='text-xl sm:text-2xl font-bold text-primary'>
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
            <MapPin className='w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0' />
            <span className='line-clamp-1'>{property.location}</span>
          </div>

          {/* Features */}
          <div className='flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground pt-3 border-t border-border mt-auto'>
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
            <span className='text-muted-foreground/70'>
              {formatDate(property.datePosted, "ru-RU", { relative: true })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
