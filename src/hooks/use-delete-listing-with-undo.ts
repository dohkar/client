import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/lib/react-query/query-keys";
import { listingsService } from "@/services/listings.service";
import type { Listing } from "@/types/listing";
import type { PaginatedResponse } from "@/types";

const UNDO_TIMEOUT_MS = 5000;

interface PendingDelete {
  targetId: string;
  targetTitle?: string;
  previousData: Map<string, unknown>;
  timeoutId: ReturnType<typeof setTimeout>;
  toastId: string | number;
  status: "pending" | "executing" | "cancelled";
}

function isPaginatedListingResponse(data: unknown): data is PaginatedResponse<Listing> {
  return (
    typeof data === "object" &&
    data !== null &&
    "data" in data &&
    Array.isArray((data as PaginatedResponse<Listing>).data) &&
    "total" in data
  );
}

/**
 * Удаление листинга с optimistic update и отменой (как useDeleteWithUndo для Property).
 */
export function useDeleteListingWithUndo() {
  const queryClient = useQueryClient();
  const pendingDeletes = useRef<Map<string, PendingDelete>>(new Map());
  const isMounted = useRef(true);
  const executeDeleteRef = useRef<((id: string) => Promise<boolean>) | undefined>(
    undefined
  );

  const snapshotCache = useCallback((): Map<string, unknown> => {
    const snapshot = new Map<string, unknown>();
    const cache = queryClient.getQueryCache();
    const queries = cache.findAll({ queryKey: queryKeys.listings.all });
    queries.forEach((query) => {
      const key = JSON.stringify(query.queryKey);
      snapshot.set(key, structuredClone(query.state.data));
    });
    return snapshot;
  }, [queryClient]);

  const applyOptimisticDelete = useCallback(
    async (listingId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.listings.all });
      const cache = queryClient.getQueryCache();
      const queries = cache.findAll({ queryKey: queryKeys.listings.all });
      queries.forEach((query) => {
        queryClient.setQueryData(query.queryKey, (oldData: unknown) => {
          if (!oldData) return oldData;
          if (isPaginatedListingResponse(oldData)) {
            return {
              ...oldData,
              data: oldData.data.filter((l) => l.id !== listingId),
              total: Math.max(0, oldData.total - 1),
            };
          }
          if (Array.isArray(oldData)) {
            return oldData.filter((l: Listing) => l.id !== listingId);
          }
          return oldData;
        });
      });
      queryClient.removeQueries({ queryKey: queryKeys.listings.detail(listingId) });
    },
    [queryClient]
  );

  const restoreCache = useCallback(
    (snapshot: Map<string, unknown>) => {
      snapshot.forEach((data, key) => {
        const queryKey = JSON.parse(key) as unknown[];
        queryClient.setQueryData(queryKey, data);
      });
    },
    [queryClient]
  );

  const executeDelete = useCallback(
    async (listingId: string): Promise<boolean> => {
      const pending = pendingDeletes.current.get(listingId);
      if (!pending || pending.status === "cancelled") {
        return false;
      }
      pending.status = "executing";
      try {
        await listingsService.deleteListing(listingId);
        if (isMounted.current) {
          await queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
          await queryClient.invalidateQueries({ queryKey: queryKeys.listings.limits });
        }
        pendingDeletes.current.delete(listingId);
        return true;
      } catch {
        if (pending.previousData && isMounted.current) {
          restoreCache(pending.previousData);
          toast.error("Не удалось удалить объявление", {
            description: "Данные восстановлены",
          });
        }
        pendingDeletes.current.delete(listingId);
        return false;
      }
    },
    [queryClient, restoreCache]
  );

  useEffect(() => {
    executeDeleteRef.current = executeDelete;
  }, [executeDelete]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      pendingDeletes.current.forEach((pending) => {
        if (pending.status === "pending") {
          clearTimeout(pending.timeoutId);
          toast.dismiss(pending.toastId);
          void executeDeleteRef.current?.(pending.targetId);
        }
      });
    };
  }, []);

  const undoDelete = useCallback(
    (listingId: string) => {
      const pending = pendingDeletes.current.get(listingId);
      if (!pending || pending.status !== "pending") return;
      clearTimeout(pending.timeoutId);
      pending.status = "cancelled";
      toast.dismiss(pending.toastId);
      restoreCache(pending.previousData);
      toast.success("Удаление отменено");
      pendingDeletes.current.delete(listingId);
    },
    [restoreCache]
  );

  const deleteWithUndo = useCallback(
    async (listingId: string, title?: string): Promise<boolean> => {
      if (pendingDeletes.current.has(listingId)) return false;
      const previousData = snapshotCache();
      await applyOptimisticDelete(listingId);
      const toastId = toast.success(title ? `"${title}" удалено` : "Объявление удалено", {
        duration: UNDO_TIMEOUT_MS,
        action: {
          label: "Отменить",
          onClick: () => undoDelete(listingId),
        },
      });
      const timeoutId = setTimeout(() => {
        const pending = pendingDeletes.current.get(listingId);
        if (pending?.status === "pending") {
          toast.dismiss(toastId);
          void executeDelete(listingId);
        }
      }, UNDO_TIMEOUT_MS);
      pendingDeletes.current.set(listingId, {
        targetId: listingId,
        targetTitle: title,
        previousData,
        timeoutId,
        toastId,
        status: "pending",
      });
      return true;
    },
    [snapshotCache, applyOptimisticDelete, undoDelete, executeDelete]
  );

  const isDeleting = useCallback((listingId: string): boolean => {
    const pending = pendingDeletes.current.get(listingId);
    return pending !== undefined && pending.status !== "cancelled";
  }, []);

  return { deleteWithUndo, undoDelete, isDeleting };
}
