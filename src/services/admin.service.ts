import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";
import type { PaginatedResponse } from "@/types";
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
  AdminAuditLogsParams,
  AdminChatsParams,
  UserResponseDto,
  PropertyResponseDto,
} from "@/lib/api-types";

export type AdminUser = UserResponseDto & {
  propertiesCount?: number;
  chatsCount?: number;
  bannedAt?: string | null;
  banReason?: string | null;
  bannedUntil?: string | null;
};
export type AdminProperty = PropertyResponseDto & {
  user?: { id: string; name?: string; email?: string };
  region?: { id: string; name: string };
};
export type AdminStatistics = AdminStatisticsResponse;

export const adminService = {
  async getStatistics(): Promise<AdminStatistics> {
    return apiClient.get<AdminStatistics>(API_ENDPOINTS.admin.statistics);
  },

  async getUsers(
    params?: AdminUsersParams
  ): Promise<PaginatedResponse<AdminUser>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.search) queryParams.append("search", params.search);
    if (params?.role) queryParams.append("role", params.role);
    if (params?.status) queryParams.append("status", params.status);
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.admin.users}?${queryString}`
      : API_ENDPOINTS.admin.users;
    return apiClient.get<PaginatedResponse<AdminUser>>(endpoint);
  },

  async getUserById(userId: string): Promise<AdminUser> {
    return apiClient.get<AdminUser>(API_ENDPOINTS.admin.getUserById(userId));
  },

  async banUser(
    userId: string,
    payload?: { reason?: string; bannedUntil?: string }
  ): Promise<{ success?: boolean }> {
    return apiClient.post<{ success?: boolean }>(
      API_ENDPOINTS.admin.banUser(userId),
      payload ?? {}
    );
  },

  async unbanUser(userId: string): Promise<{ success?: boolean }> {
    return apiClient.patch<{ success?: boolean }>(
      API_ENDPOINTS.admin.unbanUser(userId)
    );
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
    if (params?.regionId) queryParams.append("regionId", params.regionId);
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.admin.properties}?${queryString}`
      : API_ENDPOINTS.admin.properties;
    return apiClient.get<PaginatedResponse<AdminProperty>>(endpoint);
  },

  async updateUserRole(
    userId: string,
    role: AdminUpdateUserRoleRequest["role"]
  ): Promise<AdminUser> {
    const data: AdminUpdateUserRoleRequest = { role };
    return apiClient.patch<AdminUser>(
      API_ENDPOINTS.admin.updateUserRole(userId),
      data
    );
  },

  async updatePropertyStatus(
    propertyId: string,
    payload: AdminUpdatePropertyStatusRequest
  ): Promise<AdminProperty> {
    return apiClient.patch<AdminProperty>(
      API_ENDPOINTS.admin.updatePropertyStatus(propertyId),
      payload
    );
  },

  async deleteUser(userId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.admin.deleteUser(userId));
  },

  async deleteProperty(propertyId: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.admin.deleteProperty(propertyId));
  },

  async getAuditLogs(params?: AdminAuditLogsParams) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.entityType) queryParams.append("entityType", params.entityType);
    if (params?.userId) queryParams.append("userId", params.userId);
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.admin.auditLogs}?${queryString}`
      : API_ENDPOINTS.admin.auditLogs;
    return apiClient.get<PaginatedResponse<AuditLogEntry>>(endpoint);
  },

  async getChats(params?: AdminChatsParams) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.type) queryParams.append("type", params.type);
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.admin.chats}?${queryString}`
      : API_ENDPOINTS.admin.chats;
    return apiClient.get<PaginatedResponse<AdminChat>>(endpoint);
  },

  async closeChat(chatId: string): Promise<{ success?: boolean }> {
    return apiClient.patch<{ success?: boolean }>(
      API_ENDPOINTS.admin.closeChat(chatId)
    );
  },

  async getInboxRequests(params?: {
    category?: "CONTACT" | "COMPLAINT";
    severity?: "LOW" | "MEDIUM" | "HIGH";
    status?: "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  }) {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append("category", params.category);
    if (params?.severity) queryParams.append("severity", params.severity);
    if (params?.status) queryParams.append("status", params.status);
    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.inbox.list}?${queryString}`
      : API_ENDPOINTS.inbox.list;
    return apiClient.get<InboxRequestItem[]>(endpoint);
  },

  async updateInboxStatus(
    id: string,
    payload: { status: "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"; adminComment?: string }
  ) {
    return apiClient.patch<InboxRequestItem>(
      API_ENDPOINTS.inbox.updateStatus(id),
      payload
    );
  },
};

export type AuditLogEntry = {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  };
};

export type AdminChat = {
  id: string;
  type: "PROPERTY" | "SUPPORT";
  propertyId: string | null;
  isArchived: boolean;
  lastMessageAt: string | null;
  lastMessageText: string | null;
  createdAt: string;
  participants?: Array<{
    id: string;
    userId: string;
    role: string;
    user?: { id: string; name: string | null; email: string | null };
  }>;
  property?: { id: string; title: string; status: string } | null;
};

export type InboxRequestItem = {
  id: string;
  category: string;
  severity: string;
  status: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  propertyId: string | null;
  adminComment?: string | null;
  createdAt: string;
  property?: { id: string; title: string } | null;
  user?: { id: string; name: string | null; email: string | null } | null;
  statusHistory?: Array<{
    id: string;
    status: string;
    adminComment: string | null;
    createdAt: string;
    changedBy?: { id: string; name: string | null; email: string | null } | null;
  }>;
};
