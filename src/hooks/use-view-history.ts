"use client";

import { useState, useEffect, useCallback } from "react";
import {
  viewHistoryStorage,
  VIEW_HISTORY_STORAGE_KEY,
  VIEW_HISTORY_CHANGED_EVENT,
  type ViewHistoryItem,
} from "@/lib/history/view-history";

export function useViewHistory() {
  const [items, setItems] = useState<ViewHistoryItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  const reloadFromStorage = useCallback(() => {
    setItems(viewHistoryStorage.getAll());
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      reloadFromStorage();
      setIsReady(true);
    });
  }, [reloadFromStorage]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== localStorage) return;
      if (e.key === VIEW_HISTORY_STORAGE_KEY || e.key === null) {
        reloadFromStorage();
      }
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(VIEW_HISTORY_CHANGED_EVENT, reloadFromStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(VIEW_HISTORY_CHANGED_EVENT, reloadFromStorage);
    };
  }, [reloadFromStorage]);

  const push = useCallback((item: Omit<ViewHistoryItem, "viewedAt">) => {
    viewHistoryStorage.push(item);
  }, []);

  const remove = useCallback((id: string) => {
    viewHistoryStorage.remove(id);
  }, []);

  const clear = useCallback(() => {
    viewHistoryStorage.clear();
  }, []);

  return { items, isReady, push, remove, clear };
}
