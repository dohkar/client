import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { propertyService } from "@/services/property.service";
import type { PropertySearchParams } from "@/types/property";
import { toast } from "sonner";

/**
 * Хук для получения списка недвижимости
 */
export function useProperties(params?: PropertySearchParams) {
  return useQuery({
    queryKey: queryKeys.properties.list(params || {}),
    queryFn: () => propertyService.getProperties(params),
    staleTime: 60 * 1000, // 1 minute
    retry: 2,
  });
}

/**
 * Хук для получения одной недвижимости по ID
 */
export function useProperty(id: string) {
  return useQuery({
    queryKey: queryKeys.properties.detail(id),
    queryFn: () => propertyService.getPropertyById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Хук для поиска недвижимости
 * Не выполняет запрос для пустых или только пробельных запросов
 */
export function useSearchProperties(query: string) {
  const trimmedQuery = query.trim();
  return useQuery({
    queryKey: queryKeys.properties.search(trimmedQuery),
    queryFn: () => propertyService.searchProperties(trimmedQuery),
    enabled: trimmedQuery.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
}

/**
 * Хук для создания объявления
 */
export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Parameters<typeof propertyService.createProperty>[0]) =>
      propertyService.createProperty(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
      toast.success("Объявление успешно создано");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка при создании объявления");
    },
  });
}

/**
 * Хук для обновления объявления
 */
export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof propertyService.updateProperty>[1];
    }) => propertyService.updateProperty(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.properties.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
      toast.success("Объявление успешно обновлено");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка при обновлении объявления");
    },
  });
}

/**
 * Хук для удаления объявления
 */
export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => propertyService.deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.properties.all });
      toast.success("Объявление успешно удалено");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка при удалении объявления");
    },
  });
}

/**
 * Хук для получения статистики по категориям недвижимости
 */
export function useCategoryStats() {
  return useQuery({
    queryKey: queryKeys.properties.categoryStats,
    queryFn: () => propertyService.getCategoryStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
