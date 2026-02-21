/**
 * Сервис для работы с регионами и городами
 */

import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";
import type { RegionDto, CityDto } from "@/types/property";

export const regionsService = {
  /** Список всех регионов */
  async getRegions(): Promise<RegionDto[]> {
    return apiClient.get<RegionDto[]>(API_ENDPOINTS.regions.list);
  },

  /** Список городов, опционально по региону */
  async getCities(regionId?: string): Promise<CityDto[]> {
    const url = regionId
      ? `${API_ENDPOINTS.cities.list}?regionId=${encodeURIComponent(regionId)}`
      : API_ENDPOINTS.cities.list;
      console.log(url, '<<<<2')
    return apiClient.get<CityDto[]>(url);
  },

  /** Регион по ID с городами */
  async getRegionById(id: string): Promise<RegionDto & { cities: Array<{ id: string; name: string; slug?: string | null }> }> {
    return apiClient.get(API_ENDPOINTS.regions.getById(id));
  },
};
