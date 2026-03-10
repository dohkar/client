import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { queryKeys } from "@/lib/react-query/query-keys";
import { favoritesService } from "@/services/favorites.service";
import { useAuthStore } from "@/stores";
import { useFavoritesStore } from "@/stores";
import { toast } from "sonner";
import type { Property } from "@/types/property";
import type { Listing } from "@/types/listing";
import type { FavoriteItem } from "@/types/favorites";

/**
 * Контекст для отката optimistic updates (property)
 */
interface OptimisticContext {
  previousFavorites: FavoriteItem[] | undefined;
}

/**
 * Production-grade хук для работы с избранным
 * 
 * Особенности:
 * - Optimistic updates с корректным откатом
 * - Защита от race conditions через cancelQueries
 * - Защита от double submit через pendingMutations ref
 * - Поддержка локального хранилища для неавторизованных
 */
export function useFavorites() {
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  // Локальное хранилище для неавторизованных пользователей
  const { 
    isFavorite: isLocalFavorite, 
    toggleFavorite: toggleLocalFavorite 
  } = useFavoritesStore();

  // Защита от параллельных мутаций (propertyId или listingId)
  const pendingMutations = useRef<Set<string>>(new Set());

  // Запрос списка избранного (только для авторизованных)
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: queryKeys.favorites.all,
    queryFn: async () => {
      const response = await favoritesService.getFavorites();
      return response || [];
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000, // 2 минуты
  });

  // Добавление property в избранное с optimistic update
  const addMutation = useMutation<void, Error, string, OptimisticContext>({
    mutationFn: (propertyId: string) => favoritesService.addFavorite(propertyId),
    onMutate: async (propertyId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });
      const previousFavorites = queryClient.getQueryData<FavoriteItem[]>(queryKeys.favorites.all);
      queryClient.setQueryData<FavoriteItem[]>(queryKeys.favorites.all, (old = []) => {
        if (old.some((item) => item.data.id === propertyId)) return old;
        return [...old, { type: "property", data: { id: propertyId } as Property }];
      });
      return { previousFavorites };
    },
    onError: (error, propertyId, context) => {
      const status = (error as { status?: number }).status;
      if (status === 409) return;
      if (context?.previousFavorites) {
        queryClient.setQueryData(queryKeys.favorites.all, context.previousFavorites);
      }
      toast.error("Не удалось добавить в избранное");
    },
    onSettled: (_, __, propertyId) => {
      pendingMutations.current.delete(propertyId);
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });

  // Удаление property из избранного с optimistic update
  const removeMutation = useMutation<void, Error, string, OptimisticContext>({
    mutationFn: (propertyId: string) => favoritesService.removeFavorite(propertyId),
    onMutate: async (propertyId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });
      const previousFavorites = queryClient.getQueryData<FavoriteItem[]>(queryKeys.favorites.all);
      queryClient.setQueryData<FavoriteItem[]>(queryKeys.favorites.all, (old = []) =>
        old.filter((item) => item.data.id !== propertyId)
      );
      return { previousFavorites };
    },
    onError: (_, __, context) => {
      if (context?.previousFavorites) {
        queryClient.setQueryData(queryKeys.favorites.all, context.previousFavorites);
      }
      toast.error("Не удалось удалить из избранного");
    },
    onSettled: (_, __, propertyId) => {
      pendingMutations.current.delete(propertyId);
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });

  // Добавление listing в избранное с optimistic update
  const addListingMutation = useMutation<void, Error, string, OptimisticContext>({
    mutationFn: (listingId: string) => favoritesService.addListingFavorite(listingId),
    onMutate: async (listingId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });
      const previousFavorites = queryClient.getQueryData<FavoriteItem[]>(queryKeys.favorites.all);
      queryClient.setQueryData<FavoriteItem[]>(queryKeys.favorites.all, (old = []) => {
        if (old.some((item) => item.data.id === listingId)) return old;
        return [...old, { type: "listing", data: { id: listingId } as Listing }];
      });
      return { previousFavorites };
    },
    onError: (error, listingId, context) => {
      const status = (error as { status?: number }).status;
      if (status === 409) return;
      if (context?.previousFavorites) {
        queryClient.setQueryData(queryKeys.favorites.all, context.previousFavorites);
      }
      toast.error("Не удалось добавить в избранное");
    },
    onSettled: (_, __, listingId) => {
      pendingMutations.current.delete(listingId);
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });

  // Удаление listing из избранного с optimistic update
  const removeListingMutation = useMutation<void, Error, string, OptimisticContext>({
    mutationFn: (listingId: string) => favoritesService.removeListingFavorite(listingId),
    onMutate: async (listingId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });
      const previousFavorites = queryClient.getQueryData<FavoriteItem[]>(queryKeys.favorites.all);
      queryClient.setQueryData<FavoriteItem[]>(queryKeys.favorites.all, (old = []) =>
        old.filter((item) => item.data.id !== listingId)
      );
      return { previousFavorites };
    },
    onError: (_, __, context) => {
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

  /**
   * Проверка, находится ли объявление (property или listing) в избранном по id.
   */
  const isFavorite = useCallback(
    (id: string): boolean => {
      if (!isAuthenticated) {
        return isLocalFavorite(id);
      }
      return favorites.some((item) => item.data.id === id);
    },
    [isAuthenticated, favorites, isLocalFavorite]
  );

  /**
   * Проверка, выполняется ли мутация для данного id (property или listing).
   */
  const isMutating = useCallback((id: string): boolean => {
    return pendingMutations.current.has(id);
  }, []);

  /**
   * Toggle избранного для property. Возвращает true если действие выполнено.
   */
  const toggleFavorite = useCallback(
    (propertyId: string, _property?: Property): boolean => {
      if (!isAuthenticated) {
        toggleLocalFavorite(propertyId);
        return true;
      }
      if (pendingMutations.current.has(propertyId)) return false;
      pendingMutations.current.add(propertyId);
      const currentlyFavorite = favorites.some((item) => item.data.id === propertyId);
      if (currentlyFavorite) {
        removeMutation.mutate(propertyId);
      } else {
        addMutation.mutate(propertyId);
      }
      return true;
    },
    [isAuthenticated, favorites, toggleLocalFavorite, addMutation, removeMutation]
  );

  /**
   * Toggle избранного для listing. Возвращает true если действие выполнено.
   */
  const toggleListingFavorite = useCallback(
    (listingId: string, _listing?: Listing): boolean => {
      if (!isAuthenticated) {
        toggleLocalFavorite(listingId);
        return true;
      }
      if (pendingMutations.current.has(listingId)) return false;
      pendingMutations.current.add(listingId);
      const currentlyFavorite = favorites.some((item) => item.data.id === listingId);
      if (currentlyFavorite) {
        removeListingMutation.mutate(listingId);
      } else {
        addListingMutation.mutate(listingId);
      }
      return true;
    },
    [isAuthenticated, favorites, toggleLocalFavorite, addListingMutation, removeListingMutation]
  );

  const addToFavorites = useCallback(
    (propertyId: string): boolean => {
      if (!isAuthenticated) {
        toggleLocalFavorite(propertyId);
        return true;
      }
      if (pendingMutations.current.has(propertyId)) return false;
      if (favorites.some((item) => item.data.id === propertyId)) return false;
      pendingMutations.current.add(propertyId);
      addMutation.mutate(propertyId);
      return true;
    },
    [isAuthenticated, favorites, toggleLocalFavorite, addMutation]
  );

  const removeFromFavorites = useCallback(
    (propertyId: string): boolean => {
      if (!isAuthenticated) {
        toggleLocalFavorite(propertyId);
        return true;
      }
      if (pendingMutations.current.has(propertyId)) return false;
      if (!favorites.some((item) => item.data.id === propertyId)) return false;
      pendingMutations.current.add(propertyId);
      removeMutation.mutate(propertyId);
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
    toggleListingFavorite,
    addToFavorites,
    removeFromFavorites,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

/**
 * Хук для использования в компонентах карточек
 * Оптимизирован для минимального рендеринга
 */
export function useFavoriteStatus(propertyId: string) {
  const { isFavorite, isMutating, toggleFavorite } = useFavorites();
  
  return {
    isFavorite: isFavorite(propertyId),
    isPending: isMutating(propertyId),
    toggle: useCallback(() => toggleFavorite(propertyId), [toggleFavorite, propertyId]),
  };
}
