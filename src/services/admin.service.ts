import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";
import type { PaginatedResponse } from "@/types"; // Keep for frontend pagination structure
import type {
  AdminStatisticsResponse,
  AdminUsersParams,
  AdminPropertiesParams,
  AdminUpdateUserRoleParams,
  AdminUpdateUserRoleRequest,
  AdminUpdatePropertyStatusParams,
  AdminUpdatePropertyStatusRequest,
  AdminDeleteUserParams,
  AdminDeletePropertyParams,
  UserResponseDto, // For AdminUser
  PropertyResponseDto, // For AdminProperty
  OperationResponse,
} from "@/lib/api-types";

// Assuming AdminUser and AdminProperty are mapped from UserResponseDto and PropertyResponseDto
export type AdminUser = UserResponseDto;
export type AdminProperty = PropertyResponseDto;
export type AdminStatistics = AdminStatisticsResponse; // Direct usage

export const adminService = {
  async getStatistics(): Promise<AdminStatistics> {
    // OpenAPI spec has content?: never, but API returns AdminStatistics
    return apiClient.get<any>(API_ENDPOINTS.admin.statistics) as Promise<AdminStatistics>;
  },

  async getUsers(
    params?: AdminUsersParams
  ): Promise<PaginatedResponse<AdminUser>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.admin.users}?${queryString}`
      : API_ENDPOINTS.admin.users;

    const response = await apiClient.get<PaginatedResponse<AdminUser>>(endpoint);
    return response;
  },

  async getProperties(
    params?: AdminPropertiesParams
  ): Promise<PaginatedResponse<AdminProperty>> {
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

    const response = await apiClient.get<PaginatedResponse<AdminProperty>>(endpoint);
    return response;
  },

  async updateUserRole(
    userId: string,
    role: AdminUpdateUserRoleRequest["role"] // Use specific type
  ): Promise<AdminUser> {
    const params: AdminUpdateUserRoleParams = { id: userId };
    const data: AdminUpdateUserRoleRequest = { role };
    return apiClient.patch<AdminUser>(
      API_ENDPOINTS.admin.updateUserRole(params.id),
      data
    );
  },

  async updatePropertyStatus(
    propertyId: string,
    status: AdminUpdatePropertyStatusRequest["status"] // Use specific type
  ): Promise<AdminProperty> {
    const params: AdminUpdatePropertyStatusParams = { id: propertyId };
    const data: AdminUpdatePropertyStatusRequest = { status };
    return apiClient.patch<AdminProperty>(
      API_ENDPOINTS.admin.updatePropertyStatus(params.id),
      data
    );
  },

  async deleteUser(userId: string): Promise<void> {
    const params: AdminDeleteUserParams = { id: userId };
    await apiClient.delete<OperationResponse<"AdminController_deleteUser", 200>>(
      API_ENDPOINTS.admin.deleteUser(params.id)
    );
  },

  async deleteProperty(propertyId: string): Promise<void> {
    const params: AdminDeletePropertyParams = { id: propertyId };
    await apiClient.delete<OperationResponse<"AdminController_deleteProperty", 200>>(
      API_ENDPOINTS.admin.deleteProperty(params.id)
    );
  },
};
