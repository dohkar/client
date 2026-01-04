import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";
import { adaptProperty } from "@/lib/property-adapter";
import type {
  ApiResponse,
  PaginatedResponse,
} from "@/types";
import type { Property, PropertySearchParams, PropertyBackend } from "@/types/property";

/**
 * Сервис для работы с недвижимостью
 */
export const propertyService = {
  /**
   * Получить список недвижимости с фильтрами и пагинацией
   */
  async getProperties(
    params?: PropertySearchParams
  ): Promise<PaginatedResponse<Property>> {
    const queryParams = new URLSearchParams();

    if (params?.query) queryParams.append("query", params.query);
    if (params?.type) queryParams.append("type", params.type.toUpperCase());
    if (params?.priceMin) queryParams.append("priceMin", params.priceMin.toString());
    if (params?.priceMax) queryParams.append("priceMax", params.priceMax.toString());
    if (params?.rooms) queryParams.append("rooms", params.rooms.toString());
    if (params?.areaMin) queryParams.append("areaMin", params.areaMin.toString());
    if (params?.region) queryParams.append("region", params.region.toUpperCase());
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.properties.list}?${queryString}`
      : API_ENDPOINTS.properties.list;

    const response = await apiClient.get<ApiResponse<PaginatedResponse<PropertyBackend>>>(endpoint);

    if (response.status === "success" && response.data) {
      return {
        ...response.data,
        data: response.data.data.map(adaptProperty),
      };
    }

    throw new Error(response.message || "Ошибка загрузки объявлений");
  },

  /**
   * Получить недвижимость по ID
   */
  async getPropertyById(id: string): Promise<ApiResponse<Property>> {
    const response = await apiClient.get<ApiResponse<PropertyBackend>>(
      API_ENDPOINTS.properties.getById(id)
    );

    if (response.status === "success" && response.data) {
      return {
        ...response,
        data: adaptProperty(response.data),
      };
    }

    throw new Error(response.message || "Ошибка загрузки объявления");
  },

  /**
   * Поиск недвижимости
   */
  async searchProperties(query: string): Promise<ApiResponse<Property[]>> {
    const response = await apiClient.get<ApiResponse<PropertyBackend[]>>(
      `${API_ENDPOINTS.properties.search}?q=${encodeURIComponent(query)}`
    );

    if (response.status === "success" && response.data) {
      return {
        ...response,
        data: response.data.map(adaptProperty),
      };
    }

    return {
      ...response,
      data: [],
    };
  },

  /**
   * Создать объявление
   */
  async createProperty(
    data: Omit<Property, "id" | "datePosted" | "createdAt" | "updatedAt" | "views" | "status" | "userId" | "contact" | "isPremium" | "image">
  ): Promise<ApiResponse<Property>> {
    // Преобразуем данные в формат бэкенда
    const backendData = {
      title: data.title,
      price: data.price,
      currency: data.currency?.toUpperCase() || "RUB",
      location: data.location,
      region: data.region?.toUpperCase() || "OTHER",
      type: data.type?.toUpperCase() || "APARTMENT",
      rooms: data.rooms,
      area: data.area,
      description: data.description,
      images: data.images || [],
      features: data.features || [],
    };

    const response = await apiClient.post<ApiResponse<PropertyBackend>>(
      API_ENDPOINTS.properties.create,
      backendData
    );

    if (response.status === "success" && response.data) {
      return {
        ...response,
        data: adaptProperty(response.data),
      };
    }

    throw new Error(response.message || "Ошибка загрузки объявления");
  },

  /**
   * Обновить объявление
   */
  async updateProperty(
    id: string,
    data: Partial<Property>
  ): Promise<ApiResponse<Property>> {
    // Преобразуем данные в формат бэкенда
    interface BackendUpdateData {
      title?: string;
      price?: number;
      currency?: string;
      location?: string;
      region?: string;
      type?: string;
      rooms?: number;
      area?: number;
      description?: string;
      images?: string[];
      features?: string[];
      status?: string;
    }

    const backendData: BackendUpdateData = {};
    if (data.title) backendData.title = data.title;
    if (data.price !== undefined) backendData.price = data.price;
    if (data.currency) backendData.currency = data.currency.toUpperCase();
    if (data.location) backendData.location = data.location;
    if (data.region) backendData.region = data.region.toUpperCase();
    if (data.type) backendData.type = data.type.toUpperCase();
    if (data.rooms !== undefined) backendData.rooms = data.rooms;
    if (data.area !== undefined) backendData.area = data.area;
    if (data.description) backendData.description = data.description;
    if (data.images) backendData.images = data.images;
    if (data.features) backendData.features = data.features;
    if (data.status) backendData.status = data.status.toUpperCase();

    const response = await apiClient.patch<ApiResponse<PropertyBackend>>(
      API_ENDPOINTS.properties.update(id),
      backendData
    );

    if (response.status === "success" && response.data) {
      return {
        ...response,
        data: adaptProperty(response.data),
      };
    }

    throw new Error(response.message || "Ошибка загрузки объявления");
  },

  /**
   * Удалить объявление
   */
  async deleteProperty(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.properties.delete(id)
    );
    return response;
  },

  /**
   * Получить статистику по категориям недвижимости
   */
  async getCategoryStats(): Promise<ApiResponse<Array<{ type: string; count: number }>>> {
    const response = await apiClient.get<ApiResponse<Array<{ type: string; count: number }>>>(
      API_ENDPOINTS.properties.categoryStats
    );
    return response;
  },
};
