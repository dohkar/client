export * from "./use-local-storage";
export * from "./use-debounce";
export * from "./use-media-query";
export * from "./use-click-outside";
export * from "./use-amenities";
export { useSearchFilters } from "./use-search-filters";
export { useProfile } from "./use-profile";

// Optimistic updates hooks
export { useFavorites, useFavoriteStatus } from "./use-favorites";
export { useDeleteListing, useRemoveFavoriteOptimistic } from "./use-optimistic-delete";

// Undo delete hooks (production-grade)
export { useDeleteWithUndo, useRemoveFavoriteWithUndo } from "./use-undo-delete";

// Re-export existing hooks
export {
  useProperties,
  useProperty,
  useSearchProperties,
  useCreateProperty,
  useUpdateProperty,
  useDeleteProperty,
  useCategoryStats,
} from "./use-properties";
