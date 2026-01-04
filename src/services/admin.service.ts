import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";
import type { ApiResponse, PaginatedResponse } from "@/types";

export interface AdminStatistics {
  overview: {
    totalUsers: number;
    totalProperties: number;
    activeProperties: number;
    pendingProperties: number;
    totalViews: number;
    premiumUsers: number;
    newUsersLast30Days: number;
    newPropertiesLast30Days: number;
  };
  propertiesByType: Array<{ type: string; count: number }>;
  propertiesByRegion: Array<{ region: string; count: number }>;
  dailyStats: Array<{ date: string; count: number }>;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  isPremium: boolean;
  role: string;
  createdAt: string;
  propertiesCount: number;
}

export interface AdminProperty {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  region: string;
  type: string;
  status: string;
  views: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export const adminService = {
  async getStatistics(): Promise<ApiResponse<AdminStatistics>> {
    return apiClient.get<ApiResponse<AdminStatistics>>(API_ENDPOINTS.admin.statistics);
  },

  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<PaginatedResponse<AdminUser>>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.admin.users}?${queryString}`
      : API_ENDPOINTS.admin.users;

    return apiClient.get<ApiResponse<PaginatedResponse<AdminUser>>>(endpoint);
  },

  async getProperties(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
  }): Promise<ApiResponse<PaginatedResponse<AdminProperty>>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.type) queryParams.append("type", params.type);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.admin.properties}?${queryString}`
      : API_ENDPOINTS.admin.properties;

    return apiClient.get<ApiResponse<PaginatedResponse<AdminProperty>>>(endpoint);
  },

  async updateUserRole(userId: string, role: string): Promise<ApiResponse<AdminUser>> {
    return apiClient.patch<ApiResponse<AdminUser>>(API_ENDPOINTS.admin.updateUserRole(userId), {
      role,
    });
  },

  async updatePropertyStatus(
    propertyId: string,
    status: string
  ): Promise<ApiResponse<AdminProperty>> {
    return apiClient.patch<ApiResponse<AdminProperty>>(
      API_ENDPOINTS.admin.updatePropertyStatus(propertyId),
      { status }
    );
  },

  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.admin.deleteUser(userId));
  },

  async deleteProperty(propertyId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.admin.deleteProperty(propertyId));
  },
};
