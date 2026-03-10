import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { listingsService } from "@/services/listings.service";
import type { ListingSearchParams } from "@/types/listing";
import { toast } from "sonner";

export function useListings(params?: ListingSearchParams) {
  return useQuery({
    queryKey: queryKeys.listings.list(params),
    queryFn: () => listingsService.getListings(params),
    staleTime: 60 * 1000,
    retry: 2,
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: queryKeys.listings.detail(id),
    queryFn: () => listingsService.getListingById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => listingsService.createListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.limits });
      toast.success("Объявление успешно создано");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка при создании объявления");
    },
  });
}

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      listingsService.updateListing(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      toast.success("Объявление обновлено");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка при обновлении объявления");
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => listingsService.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all });
      toast.success("Объявление удалено");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка при удалении объявления");
    },
  });
}

export function useListingCategoryStats() {
  return useQuery({
    queryKey: queryKeys.listings.categoryStats,
    queryFn: () => listingsService.getCategoryStats(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useRelatedListings(id: string | undefined, limit = 6) {
  return useQuery({
    queryKey: [...queryKeys.listings.detail(id ?? ""), "related", limit],
    queryFn: () => listingsService.getRelatedListings(id!, limit),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

export function useListingLimits(enabled = true) {
  return useQuery({
    queryKey: queryKeys.listings.limits,
    queryFn: () => listingsService.getListingLimits(),
    enabled,
    staleTime: 60 * 1000,
    retry: 1,
  });
}
