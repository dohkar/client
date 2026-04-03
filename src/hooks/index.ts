export * from "./use-local-storage";
export * from "./use-debounce";
export * from "./use-media-query";
export * from "./use-click-outside";
export * from "./use-amenities";
export { useSearchFilters, useParsedSearchFilters } from "./use-search-filters";
export { useCities } from "./use-cities";
export { useProfile } from "./use-profile";

// Optimistic updates hooks
export { useFavorites, useFavoriteStatus } from "./use-favorites";
export { useDeleteListing, useRemoveFavoriteOptimistic } from "./use-optimistic-delete";

// Undo delete hooks (production-grade)
export { useDeleteWithUndo, useRemoveFavoriteWithUndo } from "./use-undo-delete";
export { useDeleteListingWithUndo } from "./use-delete-listing-with-undo";

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
