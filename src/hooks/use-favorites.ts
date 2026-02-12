import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { queryKeys } from "@/lib/react-query/query-keys";
import { favoritesService } from "@/services/favorites.service";
import { useAuthStore } from "@/stores";
import { useFavoritesStore } from "@/stores";
import { toast } from "sonner";
import type { Property } from "@/types/property";

/**
 * Контекст для отката optimistic updates
 */
interface OptimisticContext {
  previousFavorites: Property[] | undefined;
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

  // Защита от параллельных мутаций одного propertyId
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

  // Добавление в избранное с optimistic update
  const addMutation = useMutation<void, Error, string, OptimisticContext>({
    mutationFn: (propertyId: string) => favoritesService.addFavorite(propertyId),
    
    onMutate: async (propertyId) => {
      // Отменяем исходящие запросы для предотвращения перезаписи optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });
      
      // Сохраняем предыдущее состояние для отката
      const previousFavorites = queryClient.getQueryData<Property[]>(queryKeys.favorites.all);
      
      // Optimistic update: создаём placeholder объект
      // Реальные данные придут после invalidateQueries
      queryClient.setQueryData<Property[]>(queryKeys.favorites.all, (old = []) => {
        // Проверяем, нет ли уже этого property в списке
        if (old.some(p => p.id === propertyId)) {
          return old;
        }
        // Добавляем минимальный placeholder (будет заменён после refetch)
        return [...old, { id: propertyId } as Property];
      });
      
      return { previousFavorites };
    },
    
    onError: (error, propertyId, context) => {
      const status = (error as { status?: number }).status;
      if (status === 409) {
        // Уже в избранном — считаем успехом, onSettled обновит список
        return;
      }
      if (context?.previousFavorites) {
        queryClient.setQueryData(queryKeys.favorites.all, context.previousFavorites);
      }
      toast.error("Не удалось добавить в избранное");
    },
    
    onSettled: (_, __, propertyId) => {
      // Убираем из pending и синхронизируем с сервером
      pendingMutations.current.delete(propertyId);
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });

  // Удаление из избранного с optimistic update
  const removeMutation = useMutation<void, Error, string, OptimisticContext>({
    mutationFn: (propertyId: string) => favoritesService.removeFavorite(propertyId),
    
    onMutate: async (propertyId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });
      
      const previousFavorites = queryClient.getQueryData<Property[]>(queryKeys.favorites.all);
      
      // Optimistic update: убираем property из списка
      queryClient.setQueryData<Property[]>(queryKeys.favorites.all, (old = []) => {
        return old.filter(p => p.id !== propertyId);
      });
      
      return { previousFavorites };
    },
    
    onError: (error, propertyId, context) => {
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

  /**
   * Проверка, находится ли property в избранном
   * Учитывает авторизацию и pending мутации
   */
  const isFavorite = useCallback((propertyId: string): boolean => {
    if (!isAuthenticated) {
      return isLocalFavorite(propertyId);
    }
    return favorites.some(fav => fav.id === propertyId);
  }, [isAuthenticated, favorites, isLocalFavorite]);

  /**
   * Проверка, выполняется ли мутация для конкретного property
   */
  const isMutating = useCallback((propertyId: string): boolean => {
    return pendingMutations.current.has(propertyId);
  }, []);

  /**
   * Toggle избранного с защитой от spam-кликов
   * Возвращает true если действие было выполнено
   */
  const toggleFavorite = useCallback((propertyId: string, property?: Property): boolean => {
    // Для неавторизованных используем локальное хранилище
    if (!isAuthenticated) {
      toggleLocalFavorite(propertyId);
      return true;
    }

    // Защита от double submit
    if (pendingMutations.current.has(propertyId)) {
      return false;
    }

    pendingMutations.current.add(propertyId);

    const currentlyFavorite = favorites.some(fav => fav.id === propertyId);
    
    if (currentlyFavorite) {
      removeMutation.mutate(propertyId);
    } else {
      addMutation.mutate(propertyId);
    }

    return true;
  }, [isAuthenticated, favorites, toggleLocalFavorite, addMutation, removeMutation]);

  /**
   * Добавить в избранное (явный метод)
   */
  const addToFavorites = useCallback((propertyId: string): boolean => {
    if (!isAuthenticated) {
      toggleLocalFavorite(propertyId);
      return true;
    }

    if (pendingMutations.current.has(propertyId)) {
      return false;
    }

    if (favorites.some(fav => fav.id === propertyId)) {
      return false; // Уже в избранном
    }

    pendingMutations.current.add(propertyId);
    addMutation.mutate(propertyId);
    return true;
  }, [isAuthenticated, favorites, toggleLocalFavorite, addMutation]);

  /**
   * Удалить из избранного (явный метод)
   */
  const removeFromFavorites = useCallback((propertyId: string): boolean => {
    if (!isAuthenticated) {
      toggleLocalFavorite(propertyId);
      return true;
    }

    if (pendingMutations.current.has(propertyId)) {
      return false;
    }

    if (!favorites.some(fav => fav.id === propertyId)) {
      return false; // Не в избранном
    }

    pendingMutations.current.add(propertyId);
    removeMutation.mutate(propertyId);
    return true;
  }, [isAuthenticated, favorites, toggleLocalFavorite, removeMutation]);

  return {
    // Данные
    favorites,
    isLoading,
    
    // Проверки
    isFavorite,
    isMutating,
    
    // Действия
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    
    // Для доступа к состоянию мутаций (если нужно в UI)
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
