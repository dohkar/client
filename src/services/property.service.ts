import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";
import { adaptProperty } from "@/lib/property-adapter";
import type { PaginatedResponse } from "@/types";
import type { Property, PropertyBackend } from "@/types/property";
import type {
  ApiPropertyListParams,
  ApiPropertyGetByIdResponse,
  ApiPropertyCreateRequest,
  ApiPropertyCreateResponse,
  ApiPropertyUpdateRequest,
  ApiPropertyUpdateResponse,
  ApiPropertySearchResponse,
  OperationResponse,
} from "@/lib/api-types";

/**
 * Сервис для работы с недвижимостью
 */
export const propertyService = {
  /**
   * Получить список недвижимости с фильтрами и пагинацией
   */
  async getProperties(
    params?: ApiPropertyListParams
  ): Promise<PaginatedResponse<Property>> {
    const queryParams = new URLSearchParams();

    if (params?.query) queryParams.append("query", params.query);
    if (params?.type) queryParams.append("type", params.type);
    if (params?.priceMin) queryParams.append("priceMin", params.priceMin.toString());
    if (params?.priceMax) queryParams.append("priceMax", params.priceMax.toString());
    if (params?.rooms) queryParams.append("rooms", params.rooms.toString());
    if (params?.areaMin) queryParams.append("areaMin", params.areaMin.toString());
    if (params?.region) queryParams.append("region", params.region);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.properties.list}?${queryString}`
      : API_ENDPOINTS.properties.list;

    // OpenAPI spec has content?: never, but API returns PaginatedResponse
    const response = await apiClient.get<any>(endpoint) as PaginatedResponse<PropertyBackend>;
    return {
      ...response,
      data: response.data.map(adaptProperty),
    };
  },

  /**
   * Получить недвижимость по ID
   */
  async getPropertyById(id: string): Promise<Property> {
    const response = await apiClient.get<ApiPropertyGetByIdResponse>(
      API_ENDPOINTS.properties.getById(id)
    );
    return adaptProperty(response); // Directly adapt the response
  },

  /**
   * Поиск недвижимости
   */
  async searchProperties(query: string): Promise<Property[]> {
    const response = await apiClient.get<ApiPropertySearchResponse>(
      `${API_ENDPOINTS.properties.search}?q=${encodeURIComponent(query)}`
    );
    return response.map(adaptProperty); // Directly map the response
  },

  /**
   * Создать объявление
   */
  async createProperty(
    data: ApiPropertyCreateRequest
  ): Promise<Property> {
    const response = await apiClient.post<ApiPropertyCreateResponse>(
      API_ENDPOINTS.properties.create,
      data
    );
    return adaptProperty(response);
  },

  /**
   * Обновить объявление
   */
  async updateProperty(
    id: string,
    data: ApiPropertyUpdateRequest
  ): Promise<Property> {
    const response = await apiClient.patch<ApiPropertyUpdateResponse>(
      API_ENDPOINTS.properties.update(id),
      data
    );
    return adaptProperty(response);
  },

  /**
   * Удалить объявление
   */
  async deleteProperty(id: string): Promise<void> {
    await apiClient.delete<OperationResponse<"PropertiesController_remove", 200>>(
      API_ENDPOINTS.properties.delete(id)
    );
  },

  /**
   * Получить статистику по категориям недвижимости
   */
  async getCategoryStats(): Promise<Array<{ type: string; count: number }>> {
    // Note: This endpoint is not in OpenAPI spec, using any temporarily
    const response = await apiClient.get<any>(API_ENDPOINTS.properties.categoryStats);
    return response as Array<{ type: string; count: number }>;
  },
};
