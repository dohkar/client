import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { queryKeys } from "@/lib/react-query/query-keys";
import { favoritesService } from "@/services/favorites.service";
import { useAuthStore } from "@/stores";
import { useFavoritesStore } from "@/stores";
import { toast } from "sonner";
import type { Listing } from "@/types/listing";
import type { FavoriteItem } from "@/types/favorites";
import type { ExtendedError } from "@/types";

interface OptimisticContext {
  previousFavorites: FavoriteItem[] | undefined;
}

interface AddFavoriteVariables {
  listingId: string;
  listing?: Listing;
}

export function useFavorites() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { isFavorite: isLocalFavorite, toggleFavorite: toggleLocalFavorite } =
    useFavoritesStore();

  const pendingMutations = useRef<Set<string>>(new Set());

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: queryKeys.favorites.all,
    queryFn: async () => {
      const response = await favoritesService.getFavorites();
      return response || [];
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });

  const addMutation = useMutation<void, Error, AddFavoriteVariables, OptimisticContext>({
    mutationFn: ({ listingId }) => favoritesService.addFavorite(listingId),
    onMutate: async ({ listingId, listing }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });
      const previousFavorites = queryClient.getQueryData<FavoriteItem[]>(
        queryKeys.favorites.all
      );
      queryClient.setQueryData<FavoriteItem[]>(queryKeys.favorites.all, (old = []) => {
        if (old.some((item) => item.data.id === listingId)) return old;
        const data = listing ?? ({ id: listingId } as Listing);
        return [...old, { type: "listing", data }];
      });
      return { previousFavorites };
    },
    onError: (error, _vars, context) => {
      const status = (error as ExtendedError).status;
      if (status === 409) return;
      if (context?.previousFavorites) {
        queryClient.setQueryData(queryKeys.favorites.all, context.previousFavorites);
      }
      toast.error("Не удалось добавить в избранное");
    },
    onSettled: (_, __, variables) => {
      pendingMutations.current.delete(variables.listingId);
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });

  const removeMutation = useMutation<void, Error, string, OptimisticContext>({
    mutationFn: (listingId: string) => favoritesService.removeFavorite(listingId),
    onMutate: async (listingId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });
      const previousFavorites = queryClient.getQueryData<FavoriteItem[]>(
        queryKeys.favorites.all
      );
      queryClient.setQueryData<FavoriteItem[]>(queryKeys.favorites.all, (old = []) =>
        old.filter((item) => item.data.id !== listingId)
      );
      return { previousFavorites };
    },
    onError: (error, _listingId, context) => {
      const status = (error as ExtendedError).status;
      if (status === 404) return;
      if (context?.previousFavorites) {
        queryClient.setQueryData(queryKeys.favorites.all, context.previousFavorites);
      }
      toast.error("Не удалось удалить из избранного");
    },
    onSettled: (_, __, listingId) => {
      pendingMutations.current.delete(listingId);
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });

  const isFavorite = useCallback(
    (id: string): boolean => {
      if (!isAuthenticated) {
        return isLocalFavorite(id);
      }
      return favorites.some((item) => item.data.id === id);
    },
    [isAuthenticated, favorites, isLocalFavorite]
  );

  const isMutating = useCallback((id: string): boolean => {
    return pendingMutations.current.has(id);
  }, []);

  const toggleFavorite = useCallback(
    (listingId: string, listing?: Listing): boolean => {
      if (!isAuthenticated) {
        toggleLocalFavorite(listingId);
        return true;
      }
      if (pendingMutations.current.has(listingId)) return false;
      pendingMutations.current.add(listingId);
      const currentlyFavorite = favorites.some((item) => item.data.id === listingId);
      if (currentlyFavorite) {
        removeMutation.mutate(listingId);
      } else {
        addMutation.mutate({ listingId, listing });
      }
      return true;
    },
    [isAuthenticated, favorites, toggleLocalFavorite, addMutation, removeMutation]
  );

  const addToFavorites = useCallback(
    (listingId: string, listing?: Listing): boolean => {
      if (!isAuthenticated) {
        toggleLocalFavorite(listingId);
        return true;
      }
      if (pendingMutations.current.has(listingId)) return false;
      if (favorites.some((item) => item.data.id === listingId)) return false;
      pendingMutations.current.add(listingId);
      addMutation.mutate({ listingId, listing });
      return true;
    },
    [isAuthenticated, favorites, toggleLocalFavorite, addMutation]
  );

  const removeFromFavorites = useCallback(
    (listingId: string): boolean => {
      if (!isAuthenticated) {
        toggleLocalFavorite(listingId);
        return true;
      }
      if (pendingMutations.current.has(listingId)) return false;
      if (!favorites.some((item) => item.data.id === listingId)) return false;
      pendingMutations.current.add(listingId);
      removeMutation.mutate(listingId);
      return true;
    },
    [isAuthenticated, favorites, toggleLocalFavorite, removeMutation]
  );

  return {
    favorites,
    isLoading,
    isFavorite,
    isMutating,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

export function useFavoriteStatus(listingId: string) {
  const { isFavorite, isMutating, toggleFavorite } = useFavorites();

  return {
    isFavorite: isFavorite(listingId),
    isPending: isMutating(listingId),
    toggle: useCallback(() => toggleFavorite(listingId), [toggleFavorite, listingId]),
  };
}
