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
    if (params?.my !== undefined) queryParams.append("my", String(params.my));
    if (params?.type) queryParams.append("type", params.type);
    if (params?.dealType) queryParams.append("dealType", params.dealType);
    if (params?.priceMin != null)
      queryParams.append("priceMin", params.priceMin.toString());
    if (params?.priceMax != null)
      queryParams.append("priceMax", params.priceMax.toString());
    if (params?.rooms != null) queryParams.append("rooms", params.rooms.toString());
    if (params?.areaMin != null) queryParams.append("areaMin", params.areaMin.toString());
    if (params?.floorMin != null)
      queryParams.append("floorMin", params.floorMin.toString());
    if (params?.floorMax != null)
      queryParams.append("floorMax", params.floorMax.toString());
    if (params?.floorNotFirst !== undefined)
      queryParams.append("floorNotFirst", String(params.floorNotFirst));
    if (params?.floorNotLast !== undefined)
      queryParams.append("floorNotLast", String(params.floorNotLast));
    if (params?.regionId) queryParams.append("regionId", params.regionId);
    if (params?.cityId) queryParams.append("cityId", params.cityId);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.properties.list}?${queryString}`
      : API_ENDPOINTS.properties.list;

    // OpenAPI spec has content?: never, but API returns PaginatedResponse
    const response = (await apiClient.get<any>(
      endpoint
    )) as PaginatedResponse<PropertyBackend>;

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
    data: ApiPropertyCreateRequest & { videos?: string[] }
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
    data: ApiPropertyUpdateRequest & { videos?: string[] }
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
    const response = await apiClient.get<Array<{ type: string; count: number }>>(
      API_ENDPOINTS.properties.categoryStats
    );
    return response;
  },

  /**
   * Похожие объявления (регион/город, тип, лимит)
   */
  async getRelatedProperties(propertyId: string, limit = 6): Promise<Property[]> {
    const response = await apiClient.get<PropertyBackend[]>(
      `${API_ENDPOINTS.properties.getRelated(propertyId)}?limit=${limit}`
    );
    return Array.isArray(response) ? response.map(adaptProperty) : [];
  },

  /**
   * Лимиты объявлений для текущего пользователя (скользящие 30 дней)
   */
  async getPropertyLimits(): Promise<{
    monthlyLimit: number;
    createdInMonth: number;
    remaining: number;
    myPropertiesCount: number;
  }> {
    return apiClient.get<{
      monthlyLimit: number;
      createdInMonth: number;
      remaining: number;
      myPropertiesCount: number;
    }>(API_ENDPOINTS.properties.getLimits);
  },
};
