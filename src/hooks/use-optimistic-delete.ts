import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/react-query/query-keys";
import type { FavoriteItem } from "@/types/favorites";

/**
 * Удаление из избранного с optimistic update (страница /favorites).
 */
export function useRemoveFavoriteOptimistic() {
  const queryClient = useQueryClient();
  const pendingRemoves = useRef<Set<string>>(new Set());

  const mutation = useMutation<
    void,
    Error,
    string,
    { previousFavorites: FavoriteItem[] | undefined }
  >({
    mutationFn: async (listingId: string) => {
      const { favoritesService } = await import("@/services/favorites.service");
      return favoritesService.removeFavorite(listingId);
    },

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

    onError: (_error, _listingId, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(queryKeys.favorites.all, context.previousFavorites);
      }
      toast.error("Не удалось удалить из избранного");
    },

    onSuccess: () => {
      toast.success("Удалено из избранного");
    },

    onSettled: (_, __, listingId) => {
      pendingRemoves.current.delete(listingId);
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });

  const isRemoving = useCallback(
    (listingId: string): boolean => {
      return (
        pendingRemoves.current.has(listingId) ||
        (mutation.isPending && mutation.variables === listingId)
      );
    },
    [mutation.isPending, mutation.variables]
  );

  const remove = useCallback(
    (listingId: string): boolean => {
      if (pendingRemoves.current.has(listingId)) {
        return false;
      }

      pendingRemoves.current.add(listingId);
      mutation.mutate(listingId);
      return true;
    },
    [mutation]
  );

  return {
    remove,
    isRemoving,
    isPending: mutation.isPending,
  };
}
