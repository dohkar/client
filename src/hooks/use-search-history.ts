"use client";

import { useState, useEffect, useCallback } from "react";
import {
  searchHistoryStorage,
  type SearchHistoryItem,
} from "@/lib/history/search-history";

export function useSearchHistory() {
  const [items, setItems] = useState<SearchHistoryItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setItems(searchHistoryStorage.getAll());
    setIsReady(true);
  }, []);

  const push = useCallback(
    (item: Omit<SearchHistoryItem, "id" | "searchedAt">) => {
      searchHistoryStorage.push(item);
      setItems(searchHistoryStorage.getAll());
    },
    []
  );

  const remove = useCallback((id: string) => {
    searchHistoryStorage.remove(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clear = useCallback(() => {
    searchHistoryStorage.clear();
    setItems([]);
  }, []);

  return { items, isReady, push, remove, clear };
}
