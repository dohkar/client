import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/react-query/query-keys";
import { useAuthStore, useFavoritesStore } from "@/stores";
import type { FavoriteItem } from "@/types/favorites";

const UNDO_TIMEOUT_MS = 5000;

interface PendingDelete {
  targetId: string;
  targetTitle?: string;
  previousData: Map<string, unknown>;
  timeoutId: ReturnType<typeof setTimeout>;
  toastId: string | number;
  status: "pending" | "executing" | "cancelled";
}

/**
 * Удаление из избранного с Undo (listingId).
 */
export function useRemoveFavoriteWithUndo() {
  const queryClient = useQueryClient();
  const pendingRemoves = useRef<Map<string, PendingDelete>>(new Map());
  const isMounted = useRef(true);

  const executeRemoveRef = useRef<((id: string) => Promise<boolean>) | undefined>(
    undefined
  );

  const executeRemove = useCallback(
    async (id: string): Promise<boolean> => {
      const pending = pendingRemoves.current.get(id);
      if (!pending || pending.status === "cancelled") {
        return false;
      }

      pending.status = "executing";

      if (!useAuthStore.getState().isAuthenticated) {
        pendingRemoves.current.delete(id);
        return true;
      }

      try {
        const { favoritesService } = await import("@/services/favorites.service");
        await favoritesService.removeFavorite(id);

        if (isMounted.current) {
          await queryClient.invalidateQueries({ queryKey: queryKeys.favorites.all });
        }

        pendingRemoves.current.delete(id);
        return true;
      } catch {
        if (pending.previousData && isMounted.current) {
          const previousFavorites = pending.previousData.get("favorites");
          if (previousFavorites) {
            queryClient.setQueryData(queryKeys.favorites.all, previousFavorites);
          }
          toast.error("Не удалось удалить из избранного");
        }

        pendingRemoves.current.delete(id);
        return false;
      }
    },
    [queryClient]
  );

  useEffect(() => {
    executeRemoveRef.current = executeRemove;
  }, [executeRemove]);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
      pendingRemoves.current.forEach((pending) => {
        if (pending.status === "pending") {
          clearTimeout(pending.timeoutId);
          toast.dismiss(pending.toastId);
          executeRemoveRef.current?.(pending.targetId);
        }
      });
    };
  }, []);

  const undoRemove = useCallback(
    (id: string) => {
      const pending = pendingRemoves.current.get(id);
      if (!pending || pending.status !== "pending") {
        return;
      }

      clearTimeout(pending.timeoutId);
      pending.status = "cancelled";
      toast.dismiss(pending.toastId);

      const guestRemove = pending.previousData.get("guestRemove") === true;
      if (guestRemove) {
        useFavoritesStore.getState().addFavorite(id);
        void queryClient.invalidateQueries({ queryKey: ["favorites", "guest"] });
      } else {
        const previousFavorites = pending.previousData.get("favorites");
        if (previousFavorites) {
          queryClient.setQueryData(queryKeys.favorites.all, previousFavorites);
        }
      }

      toast.success("Удаление отменено");
      pendingRemoves.current.delete(id);
    },
    [queryClient]
  );

  const removeWithUndo = useCallback(
    async (id: string, title?: string): Promise<boolean> => {
      if (pendingRemoves.current.has(id)) {
        return false;
      }

      if (!useAuthStore.getState().isAuthenticated) {
        useFavoritesStore.getState().removeFavorite(id);
        void queryClient.invalidateQueries({ queryKey: ["favorites", "guest"] });

        const previousData = new Map<string, unknown>();
        previousData.set("guestRemove", true);

        const toastId = toast.success(
          title ? `"${title}" удалено из избранного` : "Удалено из избранного",
          {
            duration: UNDO_TIMEOUT_MS,
            action: {
              label: "Отменить",
              onClick: () => undoRemove(id),
            },
          }
        );

        const timeoutId = setTimeout(() => {
          const pending = pendingRemoves.current.get(id);
          if (pending?.status === "pending") {
            toast.dismiss(toastId);
            void executeRemove(id);
          }
        }, UNDO_TIMEOUT_MS);

        pendingRemoves.current.set(id, {
          targetId: id,
          targetTitle: title,
          previousData,
          timeoutId,
          toastId,
          status: "pending",
        });

        return true;
      }

      await queryClient.cancelQueries({ queryKey: queryKeys.favorites.all });

      const previousFavorites = queryClient.getQueryData(queryKeys.favorites.all);
      const previousData = new Map<string, unknown>();
      previousData.set("favorites", structuredClone(previousFavorites));

      queryClient.setQueryData<FavoriteItem[]>(queryKeys.favorites.all, (old = []) =>
        old.filter((item) => item.data.id !== id)
      );

      const toastId = toast.success(
        title ? `"${title}" удалено из избранного` : "Удалено из избранного",
        {
          duration: UNDO_TIMEOUT_MS,
          action: {
            label: "Отменить",
            onClick: () => undoRemove(id),
          },
        }
      );

      const timeoutId = setTimeout(() => {
        const pending = pendingRemoves.current.get(id);
        if (pending?.status === "pending") {
          toast.dismiss(toastId);
          executeRemove(id);
        }
      }, UNDO_TIMEOUT_MS);

      pendingRemoves.current.set(id, {
        targetId: id,
        targetTitle: title,
        previousData,
        timeoutId,
        toastId,
        status: "pending",
      });

      return true;
    },
    [queryClient, undoRemove, executeRemove]
  );

  const isRemoving = useCallback((id: string): boolean => {
    const pending = pendingRemoves.current.get(id);
    return pending !== undefined && pending.status !== "cancelled";
  }, []);

  return {
    removeWithUndo,
    undoRemove,
    isRemoving,
  };
}
