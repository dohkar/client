import type { Property } from "@/types/property";
import type { Listing } from "@/types/listing";

/**
 * Элемент избранного: объявление недвижимости (Property) или листинг (Listing).
 * Используется для единого списка в разделе «Избранное».
 */
export type FavoriteItem =
  | { type: "property"; data: Property }
  | { type: "listing"; data: Listing };

export function isPropertyItem(
  item: FavoriteItem
): item is { type: "property"; data: Property } {
  return item.type === "property";
}

export function isListingItem(
  item: FavoriteItem
): item is { type: "listing"; data: Listing } {
  return item.type === "listing";
}
