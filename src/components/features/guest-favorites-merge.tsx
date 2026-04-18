"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore, useFavoritesStore } from "@/stores";
import { favoritesService } from "@/services/favorites.service";
import { queryKeys } from "@/lib/react-query/query-keys";

/**
 * После входа переносит гостевое избранное (localStorage) в аккаунт и очищает локальный список.
 */
export function GuestFavoritesMerge() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const mergedForUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) {
      mergedForUserId.current = null;
    }
  }, [userId]);

  useEffect(() => {
    if (!isInitialized || !isAuthenticated || !userId) return;
    if (mergedForUserId.current === userId) return;

    const guestIds = [...useFavoritesStore.getState().favorites];
    mergedForUserId.current = userId;

    if (guestIds.length === 0) return;

    void (async () => {
      await Promise.allSettled(
        guestIds.map((listingId) => favoritesService.addFavorite(listingId))
      );
      useFavoritesStore.getState().clearFavorites();
      await queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    })();
  }, [isAuthenticated, isInitialized, queryClient, userId]);

  return null;
}
