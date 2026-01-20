import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/react-query/query-keys";
import { propertyService } from "@/services/property.service";
import type { Property } from "@/types/property";
import type { PaginatedResponse } from "@/types";

const UNDO_TIMEOUT_MS = 5000;

/**
 * Состояние отложенного удаления
 */
interface PendingDelete {
  propertyId: string;
  propertyTitle?: string;
  previousData: Map<string, unknown>;
  timeoutId: ReturnType<typeof setTimeout>;
  toastId: string | number;
  status: "pending" | "executing" | "cancelled";
}

/**
 * Production-grade хук для удаления с Undo
 * 
 * Архитектура:
 * - Optimistic delete происходит СРАЗУ (мгновенный UI feedback)
 * - Реальный запрос откладывается на 5 секунд
 * - Если пользователь нажал Undo — rollback без запроса к серверу
 * - Если таймаут истёк — выполняется реальный delete
 * 
 * Edge cases:
 * - Множественные удаления — каждое независимо
 * - Unmount компонента — таймеры очищаются, но pending deletes выполняются
 * - Race conditions — каждый delete изолирован через pendingDeletes Map
 * - Ошибка сервера — rollback + error toast
 */
export function useDeleteWithUndo() {
  const queryClient = useQueryClient();
  
  // Map для хранения всех pending deletes
  const pendingDeletes = useRef<Map<string, PendingDelete>>(new Map());
  
  // Флаг для отслеживания unmount
  const isMounted = useRef(true);
  
  // Ref для хранения executeDelete, чтобы использовать в cleanup
  const executeDeleteRef = useRef<(propertyId: string) => Promise<boolean>>();

  /**
   * Сохраняет текущее состояние кэша для возможного отката
   */
  const snapshotCache = useCallback((): Map<string, unknown> => {
    const snapshot = new Map<string, unknown>();
    const cache = queryClient.getQueryCache();
    const propertyQueries = cache.findAll({ queryKey: queryKeys.properties.all });

    propertyQueries.forEach((query) => {
      const key = JSON.stringify(query.queryKey);
      snapshot.set(key, structuredClone(query.state.data));
    });

    return snapshot;
  }, [queryClient]);

  /**
   * Применяет optimistic delete к кэшу
   */
  const applyOptimisticDelete = useCallback(async (propertyId: string) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.properties.all });

    const cache = queryClient.getQueryCache();
    const propertyQueries = cache.findAll({ queryKey: queryKeys.properties.all });

    propertyQueries.forEach((query) => {
      queryClient.setQueryData(query.queryKey, (oldData: unknown) => {
        if (!oldData) return oldData;

        if (isPaginatedResponse(oldData)) {
          return {
            ...oldData,
            data: oldData.data.filter((p) => p.id !== propertyId),
            total: Math.max(0, oldData.total - 1),
          };
        }

        if (Array.isArray(oldData)) {
          return oldData.filter((p: Property) => p.id !== propertyId);
        }

        return oldData;
      });
    });

    // Удаляем детальную страницу из кэша
    queryClient.removeQueries({
      queryKey: queryKeys.properties.detail(propertyId),
    });
  }, [queryClient]);

  /**
   * Восстанавливает кэш из snapshot
   */
  const restoreCache = useCallback((snapshot: Map<string, unknown>) => {
    snapshot.forEach((data, key) => {
      const queryKey = JSON.parse(key);
      queryClient.setQueryData(queryKey, data);
    });
  }, [queryClient]);

  /**
   * Выполняет реальный delete-запрос к серверу
   */
  const executeDelete = useCallback(async (propertyId: string): Promise<boolean> => {
    const pending = pendingDeletes.current.get(propertyId);
    if (!pending || pending.status === "cancelled") {
      return false;
    }

    pending.status = "executing";

    try {
      await propertyService.deleteProperty(propertyId);
      
      // Инвалидируем для синхронизации с сервером
      if (isMounted.current) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
      }
      
      pendingDeletes.current.delete(propertyId);
      return true;
    } catch (error) {
      // Rollback при ошибке сервера
      if (pending.previousData && isMounted.current) {
        restoreCache(pending.previousData);
        toast.error("Не удалось удалить объявление", {
          description: "Данные восстановлены",
        });
      }
      
      pendingDeletes.current.delete(propertyId);
      return false;
    }
  }, [queryClient, restoreCache]);

  // Обновляем ref при изменении executeDelete
  executeDeleteRef.current = executeDelete;

  // Очистка при unmount
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      // При unmount выполняем все pending deletes немедленно
      pendingDeletes.current.forEach((pending) => {
        if (pending.status === "pending") {
          clearTimeout(pending.timeoutId);
          toast.dismiss(pending.toastId);
          // Запускаем delete без await — компонент уже unmounted
          executeDeleteRef.current?.(pending.propertyId);
        }
      });
    };
  }, []);

  /**
   * Отменяет удаление (Undo)
   */
  const undoDelete = useCallback((propertyId: string) => {
    const pending = pendingDeletes.current.get(propertyId);
    if (!pending || pending.status !== "pending") {
      return;
    }

    // Отменяем таймер
    clearTimeout(pending.timeoutId);
    pending.status = "cancelled";

    // Закрываем toast
    toast.dismiss(pending.toastId);

    // Восстанавливаем данные
    restoreCache(pending.previousData);

    // Показываем подтверждение
    toast.success("Удаление отменено");

    // Убираем из pending
    pendingDeletes.current.delete(propertyId);
  }, [restoreCache]);

  /**
   * Основной метод удаления с Undo
   */
  const deleteWithUndo = useCallback(async (
    propertyId: string, 
    propertyTitle?: string
  ): Promise<boolean> => {
    // Защита от double delete
    if (pendingDeletes.current.has(propertyId)) {
      return false;
    }

    // 1. Сохраняем snapshot ПЕРЕД удалением
    const previousData = snapshotCache();

    // 2. Optimistic delete — UI обновляется СРАЗУ
    await applyOptimisticDelete(propertyId);

    // 3. Создаём toast с Undo кнопкой
    const toastId = toast.success(
      propertyTitle ? `"${propertyTitle}" удалено` : "Объявление удалено",
      {
        duration: UNDO_TIMEOUT_MS,
        action: {
          label: "Отменить",
          onClick: () => undoDelete(propertyId),
        },
        onDismiss: () => {
          // Toast закрыт пользователем (не через Undo) — ничего не делаем
          // таймер сам выполнит delete
        },
      }
    );

    // 4. Устанавливаем таймер для реального удаления
    const timeoutId = setTimeout(() => {
      const pending = pendingDeletes.current.get(propertyId);
      if (pending?.status === "pending") {
        toast.dismiss(toastId);
        executeDelete(propertyId);
      }
    }, UNDO_TIMEOUT_MS);

    // 5. Сохраняем состояние pending delete
    pendingDeletes.current.set(propertyId, {
      propertyId,
      propertyTitle,
      previousData,
      timeoutId,
      toastId,
      status: "pending",
    });

    return true;
  }, [snapshotCache, applyOptimisticDelete, undoDelete, executeDelete]);

  /**
   * Проверяет, находится ли объявление в процессе удаления
   */
  const isDeleting = useCallback((propertyId: string): boolean => {
    const pending = pendingDeletes.current.get(propertyId);
    return pending !== undefined && pending.status !== "cancelled";
  }, []);

  /**
   * Проверяет, можно ли отменить удаление
   */
  const canUndo = useCallback((propertyId: string): boolean => {
    const pending = pendingDeletes.current.get(propertyId);
    return pending?.status === "pending";
  }, []);

  /**
   * Принудительно выполняет все pending deletes
   * Полезно при навигации или критических действиях
   */
  const flushPendingDeletes = useCallback(async () => {
    const promises: Promise<boolean>[] = [];
    
    pendingDeletes.current.forEach((pending) => {
      if (pending.status === "pending") {
        clearTimeout(pending.timeoutId);
        toast.dismiss(pending.toastId);
        promises.push(executeDelete(pending.propertyId));
      }
    });

    await Promise.all(promises);
  }, [executeDelete]);

  return {
    deleteWithUndo,
    undoDelete,
    isDeleting,
    canUndo,
    flushPendingDeletes,
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
 * Хук для удаления из избранного с Undo
 */
export function useRemoveFavoriteWithUndo() {
  const queryClient = useQueryClient();
  const pendingRemoves = useRef<Map<string, PendingDelete>>(new Map());
  const isMounted = useRef(true);

  // Ref для хранения executeRemove, чтобы использовать в cleanup
  const executeRemoveRef = useRef<(propertyId: string) => Promise<boolean>>();

  const executeRemove = useCallback(async (propertyId: string): Promise<boolean> => {
    const pending = pendingRemoves.current.get(propertyId);
    if (!pending || pending.status === "cancelled") {
      return false;
    }

    pending.status = "executing";

    try {
      const { favoritesService } = await import("@/services/favorites.service");
      await favoritesService.removeFavorite(propertyId);
      
      if (isMounted.current) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
      }
      
      pendingRemoves.current.delete(propertyId);
      return true;
    } catch (error) {
      if (pending.previousData && isMounted.current) {
        const previousFavorites = pending.previousData.get("favorites");
        if (previousFavorites) {
          queryClient.setQueryData(queryKeys.favorites.all, previousFavorites);
        }
        toast.error("Не удалось удалить из избранного");
      }
      
      pendingRemoves.current.delete(propertyId);
      return false;
    }
  }, [queryClient]);

  // Обновляем ref при изменении executeRemove
  executeRemoveRef.current = executeRemove;

  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      // При unmount выполняем все pending removes
      pendingRemoves.current.forEach((pending) => {
        if (pending.status === "pending") {
          clearTimeout(pending.timeoutId);
          toast.dismiss(pending.toastId);
          executeRemoveRef.current?.(pending.propertyId);
        }
      });
    };
  }, []);

  const undoRemove = useCallback((propertyId: string) => {
    const pending = pendingRemoves.current.get(propertyId);
    if (!pending || pending.status !== "pending") {
      return;
    }

    clearTimeout(pending.timeoutId);
    pending.status = "cancelled";
    toast.dismiss(pending.toastId);

    const previousFavorites = pending.previousData.get("favorites");
    if (previousFavorites) {
      queryClient.setQueryData(queryKeys.favorites.all, previousFavorites);
    }

    toast.success("Удаление отменено");
    pendingRemoves.current.delete(propertyId);
  }, [queryClient]);

  const removeWithUndo = useCallback(async (
    propertyId: string,
    propertyTitle?: string
  ): Promise<boolean> => {
    if (pendingRemoves.current.has(propertyId)) {
      return false;
    }

    await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });

    const previousFavorites = queryClient.getQueryData<Property[]>(queryKeys.favorites.all);
    const previousData = new Map<string, unknown>();
    previousData.set("favorites", structuredClone(previousFavorites));

    // Optimistic remove
    queryClient.setQueryData<Property[]>(queryKeys.favorites.all, (old = []) => {
      return old.filter(p => p.id !== propertyId);
    });

    const toastId = toast.success(
      propertyTitle ? `"${propertyTitle}" удалено из избранного` : "Удалено из избранного",
      {
        duration: UNDO_TIMEOUT_MS,
        action: {
          label: "Отменить",
          onClick: () => undoRemove(propertyId),
        },
      }
    );

    const timeoutId = setTimeout(() => {
      const pending = pendingRemoves.current.get(propertyId);
      if (pending?.status === "pending") {
        toast.dismiss(toastId);
        executeRemove(propertyId);
      }
    }, UNDO_TIMEOUT_MS);

    pendingRemoves.current.set(propertyId, {
      propertyId,
      propertyTitle,
      previousData,
      timeoutId,
      toastId,
      status: "pending",
    });

    return true;
  }, [queryClient, undoRemove, executeRemove]);

  const isRemoving = useCallback((propertyId: string): boolean => {
    const pending = pendingRemoves.current.get(propertyId);
    return pending !== undefined && pending.status !== "cancelled";
  }, []);

  return {
    removeWithUndo,
    undoRemove,
    isRemoving,
  };
}
