import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import { queryKeys } from "@/lib/react-query/query-keys";
import { propertyService } from "@/services/property.service";
import { toast } from "sonner";
import type { Property } from "@/types/property";
import type { PaginatedResponse } from "@/types";

/**
 * Контекст для отката optimistic delete в списке объявлений
 */
interface DeleteListingContext {
  previousData: Map<string, unknown>;
}

/**
 * Production-grade хук для удаления объявлений с optimistic update
 * 
 * Особенности:
 * - Мгновенное удаление из UI
 * - Корректный откат при ошибке
 * - Обновляет ВСЕ закэшированные списки (разные фильтры/пагинация)
 * - Защита от double submit
 */
export function useDeleteListing() {
  const queryClient = useQueryClient();
  const pendingDeletes = useRef<Set<string>>(new Set());

  const mutation = useMutation<void, Error, string, DeleteListingContext>({
    mutationFn: (id: string) => propertyService.deleteProperty(id),

    onMutate: async (propertyId) => {
      // Отменяем все исходящие запросы properties
      await queryClient.cancelQueries({ queryKey: queryKeys.properties.all });

      // Сохраняем ВСЕ закэшированные данные для возможного отката
      const previousData = new Map<string, unknown>();

      // Получаем все закэшированные queries для properties
      const cache = queryClient.getQueryCache();
      const propertyQueries = cache.findAll({ queryKey: queryKeys.properties.all });

      propertyQueries.forEach((query) => {
        const key = JSON.stringify(query.queryKey);
        previousData.set(key, query.state.data);

        // Optimistic update для каждого закэшированного списка
        queryClient.setQueryData(query.queryKey, (oldData: unknown) => {
          if (!oldData) return oldData;

          // Проверяем, это PaginatedResponse или массив
          if (isPaginatedResponse(oldData)) {
            return {
              ...oldData,
              data: oldData.data.filter((p: Property) => p.id !== propertyId),
              total: Math.max(0, oldData.total - 1),
            };
          }

          // Если это массив (например, результаты поиска)
          if (Array.isArray(oldData)) {
            return oldData.filter((p: Property) => p.id !== propertyId);
          }

          return oldData;
        });
      });

      // Также удаляем из кэша детальной страницы
      queryClient.removeQueries({ 
        queryKey: queryKeys.properties.detail(propertyId) 
      });

      return { previousData };
    },

    onError: (error, propertyId, context) => {
      // Откатываем ВСЕ закэшированные данные
      if (context?.previousData) {
        context.previousData.forEach((data, key) => {
          const queryKey = JSON.parse(key);
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error("Не удалось удалить объявление");
    },

    onSuccess: () => {
      toast.success("Объявление удалено");
    },

    onSettled: (_, __, propertyId) => {
      pendingDeletes.current.delete(propertyId);
      // Инвалидируем для синхронизации с сервером
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
    },
  });

  /**
   * Проверка, удаляется ли конкретное объявление
   */
  const isDeleting = useCallback((propertyId: string): boolean => {
    return pendingDeletes.current.has(propertyId) || 
           (mutation.isPending && mutation.variables === propertyId);
  }, [mutation.isPending, mutation.variables]);

  /**
   * Удалить объявление с защитой от double submit
   */
  const deleteProperty = useCallback((propertyId: string): boolean => {
    if (pendingDeletes.current.has(propertyId)) {
      return false;
    }

    pendingDeletes.current.add(propertyId);
    mutation.mutate(propertyId);
    return true;
  }, [mutation]);

  /**
   * Удалить объявление с подтверждением
   */
  const deleteWithConfirm = useCallback((propertyId: string, title?: string): boolean => {
    const message = title 
      ? `Удалить объявление "${title}"?` 
      : "Удалить объявление?";

    if (!window.confirm(message)) {
      return false;
    }

    return deleteProperty(propertyId);
  }, [deleteProperty]);

  return {
    deleteProperty,
    deleteWithConfirm,
    isDeleting,
    isPending: mutation.isPending,
  };
}

/**
 * Type guard для PaginatedResponse
 */
function isPaginatedResponse(data: unknown): data is PaginatedResponse<Property> {
  return (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    Array.isArray((data as PaginatedResponse<Property>).data) &&
    "total" in data
  );
}

/**
 * Хук для удаления из избранного с optimistic update
 * Специализированная версия для страницы /favorites
 */
export function useRemoveFavoriteOptimistic() {
  const queryClient = useQueryClient();
  const pendingRemoves = useRef<Set<string>>(new Set());

  const mutation = useMutation<void, Error, string, { previousFavorites: Property[] | undefined }>({
    mutationFn: async (propertyId: string) => {
      const { favoritesService } = await import("@/services/favorites.service");
      return favoritesService.removeFavorite(propertyId);
    },

    onMutate: async (propertyId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });

      const previousFavorites = queryClient.getQueryData<Property[]>(queryKeys.favorites.all);

      // Optimistic: мгновенно убираем из списка
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

    onSuccess: () => {
      toast.success("Удалено из избранного");
    },

    onSettled: (_, __, propertyId) => {
      pendingRemoves.current.delete(propertyId);
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
    },
  });

  const isRemoving = useCallback((propertyId: string): boolean => {
    return pendingRemoves.current.has(propertyId) ||
           (mutation.isPending && mutation.variables === propertyId);
  }, [mutation.isPending, mutation.variables]);

  const remove = useCallback((propertyId: string): boolean => {
    if (pendingRemoves.current.has(propertyId)) {
      return false;
    }

    pendingRemoves.current.add(propertyId);
    mutation.mutate(propertyId);
    return true;
  }, [mutation]);

  return {
    remove,
    isRemoving,
    isPending: mutation.isPending,
  };
}
