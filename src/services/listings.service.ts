import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";
import { adaptListing } from "@/lib/listing-adapter";
import type { Listing, ListingBackend, ListingSearchParams } from "@/types/listing";
import type { PaginatedResponse } from "@/types";

function buildListingsQuery(params?: ListingSearchParams): string {
  if (!params) return "";
  const q = new URLSearchParams();
  if (params.query) q.append("query", params.query);
  if (params.my !== undefined) q.append("my", String(params.my));
  if (params.category) q.append("category", params.category);
  if (params.dealType) q.append("dealType", params.dealType);
  if (params.priceMin != null) q.append("priceMin", params.priceMin.toString());
  if (params.priceMax != null) q.append("priceMax", params.priceMax.toString());
  if (params.regionId) q.append("regionId", params.regionId);
  if (params.cityId) q.append("cityId", params.cityId);
  if (params.propertyType) q.append("propertyType", params.propertyType);
  if (params.rooms != null) q.append("rooms", params.rooms.toString());
  if (params.areaMin != null) q.append("areaMin", params.areaMin.toString());
  if (params.floorMin != null) q.append("floorMin", params.floorMin.toString());
  if (params.floorMax != null) q.append("floorMax", params.floorMax.toString());
  if (params.floorNotFirst !== undefined)
    q.append("floorNotFirst", String(params.floorNotFirst));
  if (params.sortBy) q.append("sortBy", params.sortBy);
  if (params.page) q.append("page", params.page.toString());
  if (params.limit) q.append("limit", params.limit.toString());
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const listingsService = {
  async getListings(params?: ListingSearchParams): Promise<PaginatedResponse<Listing>> {
    const endpoint = `${API_ENDPOINTS.listings.list}${buildListingsQuery(params)}`;
    const response = await apiClient.get<PaginatedResponse<ListingBackend>>(endpoint);
    return {
      ...response,
      data: response.data.map(adaptListing),
    };
  },

  async getListingById(id: string): Promise<Listing> {
    const response = await apiClient.get<ListingBackend>(
      API_ENDPOINTS.listings.getById(id)
    );
    return adaptListing(response);
  },

  async createListing(data: Record<string, unknown>): Promise<Listing> {
    const response = await apiClient.post<ListingBackend>(
      API_ENDPOINTS.listings.create,
      data
    );
    return adaptListing(response);
  },

  async updateListing(id: string, data: Record<string, unknown>): Promise<Listing> {
    const response = await apiClient.patch<ListingBackend>(
      API_ENDPOINTS.listings.update(id),
      data
    );
    return adaptListing(response);
  },

  async deleteListing(id: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.listings.delete(id));
  },

  async getRelatedListings(id: string, limit = 6): Promise<Listing[]> {
    const response = await apiClient.get<ListingBackend[]>(
      `${API_ENDPOINTS.listings.getRelated(id)}?limit=${limit}`
    );
    return Array.isArray(response) ? response.map(adaptListing) : [];
  },

  async getCategoryStats(): Promise<Array<{ category: string; count: number }>> {
    return apiClient.get<Array<{ category: string; count: number }>>(
      API_ENDPOINTS.listings.categoryStats
    );
  },

  async getListingLimits(): Promise<{
    monthlyLimit: number;
    createdInMonth: number;
    remaining: number;
    myListingsCount: number;
  }> {
    return apiClient.get<{
      monthlyLimit: number;
      createdInMonth: number;
      remaining: number;
      myListingsCount: number;
    }>(API_ENDPOINTS.listings.getLimits);
  },
};
