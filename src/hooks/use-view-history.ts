"use client";

import { useState, useEffect, useCallback } from "react";
import {
  viewHistoryStorage,
  type ViewHistoryItem,
} from "@/lib/history/view-history";

export function useViewHistory() {
  const [items, setItems] = useState<ViewHistoryItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setItems(viewHistoryStorage.getAll());
    setIsReady(true);
  }, []);

  const push = useCallback((item: Omit<ViewHistoryItem, "viewedAt">) => {
    viewHistoryStorage.push(item);
    setItems(viewHistoryStorage.getAll());
  }, []);

  const remove = useCallback((id: string) => {
    viewHistoryStorage.remove(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => {
    viewHistoryStorage.clear();
    setItems([]);
  }, []);

  return { items, isReady, push, remove, clear };
}
