/**
 * Пример типизированного сервиса для работы с недвижимостью
 *
 * Демонстрирует использование сгенерированных типов для:
 * - Параметров запросов (query, path)
 * - Тела запросов (request body)
 * - Ответов API (responses)
 * - Обработки ошибок
 */

import { apiClient } from "@/lib/api-client";
import type {
  ApiPropertyCreateRequest,
  ApiPropertyCreateResponse,
  ApiPropertyListParams,
  ApiPropertyListResponse,
  ApiPropertySearchParams,
  ApiPropertySearchResponse,
  ApiPropertyGetByIdParams,
  ApiPropertyGetByIdResponse,
  ApiPropertyUpdateParams,
  ApiPropertyUpdateRequest,
  ApiPropertyUpdateResponse,
  ApiPropertyDeleteParams,
  OperationResponse,
} from "@/lib/api-types";

/**
 * Типизированный сервис для работы с недвижимостью
 *
 * Все методы строго типизированы на основе OpenAPI спецификации.
 * TypeScript будет проверять соответствие типов на этапе компиляции.
 */
export const propertyTypedService = {
  /**
   * Получить список объявлений с фильтрами
   *
   * @param params - Параметры запроса (query string + path params)
   * @returns Promise с результатами поиска
   *
   * @example
   * ```typescript
   * const properties = await propertyTypedService.getProperties({
   *   query: "квартира",
   *   type: "APARTMENT",
   *   priceMin: 1000000,
   *   priceMax: 10000000,
   *   rooms: 2,
   *   areaMin: 50,
   *   region: "CHECHNYA",
   *   sortBy: "price-asc",
   *   page: 1,
   *   limit: 12
   * });
   * ```
   */
  async getProperties(
    params?: ApiPropertyListParams
  ): Promise<ApiPropertyListResponse> {
    const queryParams = new URLSearchParams();

    // TypeScript проверит, что все параметры соответствуют типам из OpenAPI
    if (params?.query) queryParams.append("query", params.query);
    if (params?.type) queryParams.append("type", params.type);
    if (params?.priceMin) queryParams.append("priceMin", params.priceMin.toString());
    if (params?.priceMax) queryParams.append("priceMax", params.priceMax.toString());
    if (params?.rooms) queryParams.append("rooms", params.rooms.toString());
    if (params?.areaMin) queryParams.append("areaMin", params.areaMin.toString());
    if (params?.regionId) queryParams.append("regionId", params.regionId);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/api/properties?${queryString}`
      : "/api/properties";

    const response = await apiClient.get<ApiPropertyListResponse>(endpoint);

    return response;
  },

  /**
   * Поиск объявлений
   *
   * @param params - Параметры поиска (обязательный параметр q)
   * @returns Promise с результатами поиска
   */
  async searchProperties(
    params: ApiPropertySearchParams
  ): Promise<ApiPropertySearchResponse> {
    // TypeScript гарантирует, что params.q присутствует (required в OpenAPI)
    const queryParams = new URLSearchParams();
    queryParams.append("q", params.q);

    const response = await apiClient.get<ApiPropertySearchResponse>(
      `/api/properties/search?${queryParams.toString()}`
    );

    return response;
  },

  /**
   * Получить объявление по ID
   *
   * @param params - Параметры пути (id обязателен)
   * @returns Promise с данными объявления
   */
  async getPropertyById(
    params: ApiPropertyGetByIdParams
  ): Promise<ApiPropertyGetByIdResponse> {
    const response = await apiClient.get<ApiPropertyGetByIdResponse>(
      `/api/properties/${params.id}`
    );

    return response;
  },

  /**
   * Создать объявление
   *
   * @param data - Данные для создания объявления
   * @returns Promise с созданным объявлением
   *
   * @example
   * ```typescript
   * const newProperty = await propertyTypedService.createProperty({
   *   title: "Квартира в центре Грозного",
   *   price: 5000000,
   *   currency: "RUB", // ✅ Тип проверен: только "RUB" | "USD"
   *   location: "г. Грозный, ул. Ленина, д. 10",
   *   region: "CHECHNYA", // ✅ Тип проверен: только "CHECHNYA" | "INGUSHETIA" | "OTHER"
   *   type: "APARTMENT", // ✅ Тип проверен: только "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL"
   *   rooms: 3,
   *   area: 75.5,
   *   description: "Отличная квартира в центре города",
   *   images: ["https://example.com/image1.jpg"],
   *   features: ["Балкон", "Лоджия", "Парковка"]
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Поиск с обязательным параметром q
   * const results = await propertyTypedService.searchProperties({
   *   q: "квартира" // ✅ Обязательный параметр, TypeScript проверит его наличие
   * });
   * ```
   */
  async createProperty(
    data: ApiPropertyCreateRequest
  ): Promise<ApiPropertyCreateResponse> {
    const response = await apiClient.post<ApiPropertyCreateResponse>(
      "/api/properties",
      data
    );

    return response;
  },

  /**
   * Обновить объявление
   *
   * @param params - Параметры пути (id обязателен)
   * @param data - Данные для обновления (все поля опциональны)
   * @returns Promise с обновленным объявлением
   */
  async updateProperty(
    params: ApiPropertyUpdateParams,
    data: ApiPropertyUpdateRequest
  ): Promise<ApiPropertyUpdateResponse> {
    const response = await apiClient.patch<ApiPropertyUpdateResponse>(
      `/api/properties/${params.id}`,
      data
    );

    return response;
  },

  /**
   * Удалить объявление
   *
   * @param params - Параметры пути (id обязателен)
   * @returns Promise с результатом операции
   */
  async deleteProperty(
    params: ApiPropertyDeleteParams
  ): Promise<OperationResponse<"PropertiesController_remove", 200>> {
    const response = await apiClient.delete<
      OperationResponse<"PropertiesController_remove", 200>
    >(`/api/properties/${params.id}`);

    return response;
  },
};

/**
 * Пример использования с React Query:
 *
 * ```typescript
 * import { useQuery, useMutation } from "@tanstack/react-query";
 * import { propertyTypedService } from "@/services/property-typed.service";
 *
 * // Запрос с типизацией
 * const { data, isLoading } = useQuery({
 *   queryKey: ["properties", filters],
 *   queryFn: () => propertyTypedService.getProperties(filters),
 * });
 *
 * // data автоматически типизирован как ApiPropertyListResponse
 * // TypeScript знает структуру ответа и предоставляет автодополнение
 *
 * // Мутация с типизацией
 * const createMutation = useMutation({
 *   mutationFn: (data: ApiPropertyCreateRequest) =>
 *     propertyTypedService.createProperty(data),
 *   onSuccess: (data) => {
 *     // data автоматически типизирован как ApiPropertyCreateResponse
 *     console.log("Создано объявление:", data.id);
 *   },
 * });
 * ```
 */
