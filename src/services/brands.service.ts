import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";
import type { Brand, ListingCategory } from "@/types/listing";

export const brandsService = {
  async getBrands(category?: ListingCategory, search?: string): Promise<Brand[]> {
    const q = new URLSearchParams();
    if (category) q.append("category", category);
    if (search) q.append("search", search);
    const qs = q.toString();
    const endpoint = qs
      ? `${API_ENDPOINTS.brands.list}?${qs}`
      : API_ENDPOINTS.brands.list;
    return apiClient.get<Brand[]>(endpoint);
  },

  async getBrandById(id: string): Promise<Brand> {
    return apiClient.get<Brand>(API_ENDPOINTS.brands.getById(id));
  },
};
