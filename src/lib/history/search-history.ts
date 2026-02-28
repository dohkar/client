import { z } from "zod";

const STORAGE_KEY = "search_history";
const MAX_ITEMS = 6;

export const SearchHistoryItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  region: z.string(),
  href: z.string(),
  searchedAt: z.number(),
});

export type SearchHistoryItem = z.infer<typeof SearchHistoryItemSchema>;

function safeRead(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return z.array(SearchHistoryItemSchema).parse(parsed);
  } catch {
    return [];
  }
}

function safeWrite(items: SearchHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage может быть недоступен (приватный режим)
  }
}

export const searchHistoryStorage = {
  getAll(): SearchHistoryItem[] {
    return safeRead();
  },

  push(item: Omit<SearchHistoryItem, "id" | "searchedAt">): void {
    const existing = safeRead().filter((i) => i.href !== item.href);
    const next: SearchHistoryItem[] = [
      { ...item, id: crypto.randomUUID(), searchedAt: Date.now() },
      ...existing,
    ].slice(0, MAX_ITEMS);
    safeWrite(next);
  },

  remove(id: string): void {
    safeWrite(safeRead().filter((i) => i.id !== id));
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
