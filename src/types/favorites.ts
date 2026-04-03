import type { Listing } from "@/types/listing";

/**
 * Элемент избранного: только Listing (listing-first).
 */
export type FavoriteItem = { type: "listing"; data: Listing };
