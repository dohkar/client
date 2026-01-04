import { apiClient } from "@/lib/api-client";
import type { ApiResponse } from "@/types";

/**
 * Пример сервиса для работы с API
 * Замените на свои реальные сервисы
 */
export const exampleService = {
  /**
   * Получить данные
   */
  async getData<T>(): Promise<ApiResponse<T>> {
    return apiClient.get<ApiResponse<T>>("/data");
  },

  /**
   * Создать данные
   */
  async createData<T>(data: unknown): Promise<ApiResponse<T>> {
    return apiClient.post<ApiResponse<T>>("/data", data);
  },

  /**
   * Обновить данные
   */
  async updateData<T>(id: string, data: unknown): Promise<ApiResponse<T>> {
    return apiClient.put<ApiResponse<T>>(`/data/${id}`, data);
  },

  /**
   * Удалить данные
   */
  async deleteData(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(`/data/${id}`);
  },
};
