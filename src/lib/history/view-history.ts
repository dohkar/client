import { z } from "zod";

/** Ключ в localStorage — нужен для обработчика `storage` между вкладками */
export const VIEW_HISTORY_STORAGE_KEY = "view_history";

/** Событие в текущей вкладке: `storage` там не срабатывает при своих же записях */
export const VIEW_HISTORY_CHANGED_EVENT = "dohkar:view-history-changed";

const STORAGE_KEY = VIEW_HISTORY_STORAGE_KEY;
const MAX_ITEMS = 10;

function broadcastViewHistoryChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(VIEW_HISTORY_CHANGED_EVENT));
}

export const ViewHistoryItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.string(),
  address: z.string(),
  imageUrl: z.string(),
  href: z.string(),
  viewedAt: z.number(),
});

export type ViewHistoryItem = z.infer<typeof ViewHistoryItemSchema>;

function safeRead(): ViewHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return z.array(ViewHistoryItemSchema).parse(JSON.parse(raw));
  } catch {
    return [];
  }
}

function safeWrite(items: ViewHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
}

export const viewHistoryStorage = {
  getAll(): ViewHistoryItem[] {
    return safeRead();
  },

  push(item: Omit<ViewHistoryItem, "viewedAt">): void {
    const existing = safeRead().filter((i) => i.id !== item.id);
    safeWrite([{ ...item, viewedAt: Date.now() }, ...existing].slice(0, MAX_ITEMS));
    broadcastViewHistoryChange();
  },

  remove(id: string): void {
    safeWrite(safeRead().filter((i) => i.id !== id));
    broadcastViewHistoryChange();
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    broadcastViewHistoryChange();
  },
};
