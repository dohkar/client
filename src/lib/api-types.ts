/**
 * Утилиты для работы с типами API, сгенерированными из OpenAPI спецификации
 *
 * Эти утилиты обеспечивают строгую типизацию запросов и ответов API
 * без использования any, с полной поддержкой автодополнения.
 */

import type { paths, components, operations } from "@/types/api";
import type { PaginatedResponse } from "@/types";

/**
 * Типы для компонентов (DTO)
 */
export type ApiSchemas = components["schemas"];

// Экспорт часто используемых типов
export type SendPhoneCodeDto = ApiSchemas["SendPhoneCodeDto"];
export type VerifyPhoneCodeDto = ApiSchemas["VerifyPhoneCodeDto"];
export type RegisterPhonePasswordDto = ApiSchemas["RegisterPhonePasswordDto"];
// LoginPhonePasswordDto не генерируется OpenAPI так как бэкенд использует LocalAuthGuard
// Определяем вручную на основе RegisterPhonePasswordDto
export type LoginPhonePasswordDto = {
  phone: string;
  password: string;
};
export type RefreshTokenDto = ApiSchemas["RefreshTokenDto"];
export type UserResponseDto = ApiSchemas["UserResponseDto"];
export type UpdateUserDto = ApiSchemas["UpdateUserDto"];
export type CreatePropertyDto = ApiSchemas["CreatePropertyDto"];
export type PropertyResponseDto = ApiSchemas["PropertyResponseDto"];
export type UpdatePropertyDto = ApiSchemas["UpdatePropertyDto"];
export type FavoriteResponseDto = ApiSchemas["FavoriteResponseDto"];
export type UpdateUserRoleDto = ApiSchemas["UpdateUserRoleDto"];
export type UpdatePropertyStatusDto = ApiSchemas["UpdatePropertyStatusDto"];

/**
 * Утилита для извлечения типа запроса из операции
 */
export type RequestBody<
  Path extends keyof paths,
  Method extends keyof paths[Path],
> = paths[Path][Method] extends {
  requestBody: { content: { "application/json": infer T } };
}
  ? T
  : never;

/**
 * Утилита для извлечения типа ответа из операции
 */
export type ResponseData<
  Path extends keyof paths,
  Method extends keyof paths[Path],
  Status extends number = 200,
> = paths[Path][Method] extends {
  responses: { [K in Status]: { content: { "application/json": infer T } } };
}
  ? T
  : paths[Path][Method] extends {
        responses: { [K in Status]: { content?: never } };
      }
    ? void
    : never;

/**
 * Утилита для извлечения параметров запроса (query, path)
 */
export type RequestParams<
  Path extends keyof paths,
  Method extends keyof paths[Path],
> = paths[Path][Method] extends { parameters: infer P }
  ? P extends { query?: infer Q; path?: infer PathParams }
    ? (Q extends Record<string, unknown> ? Q : Record<string, never>) &
        (PathParams extends Record<string, unknown> ? PathParams : Record<string, never>)
    : never
  : paths[Path][Method] extends { parameters: infer P }
    ? P extends { query: infer Q; path?: infer PathParams }
      ? (Q extends Record<string, unknown> ? Q : Record<string, never>) &
          (PathParams extends Record<string, unknown>
            ? PathParams
            : Record<string, never>)
      : never
    : never;

/**
 * Утилита для извлечения типа операции по operationId
 */
export type Operation<OperationId extends keyof operations> = operations[OperationId];

/**
 * Утилита для извлечения типа тела запроса из операции
 */
export type OperationRequestBody<OperationId extends keyof operations> =
  operations[OperationId] extends {
    requestBody: { content: { "application/json": infer T } };
  }
    ? T
    : never;

/**
 * Утилита для извлечения типа ответа из операции
 */
export type OperationResponse<
  OperationId extends keyof operations,
  Status extends number = 200,
> = operations[OperationId] extends {
  responses: { [K in Status]: { content: { "application/json": infer T } } };
}
  ? T
  : operations[OperationId] extends {
        responses: { [K in Status]: { content?: never } };
      }
    ? void
    : never;

/**
 * Утилита для извлечения параметров операции
 */
export type OperationParams<OperationId extends keyof operations> =
  operations[OperationId] extends { parameters: infer P }
    ? P extends { query?: infer Q; path?: infer PathParams }
      ? (Q extends Record<string, unknown> ? Q : Record<string, never>) &
          (PathParams extends Record<string, unknown>
            ? PathParams
            : Record<string, never>)
      : never
    : never;

/**
 * Типы для конкретных эндпоинтов (примеры использования)
 */

// Auth endpoints
export type AuthSendCodeRequest = RequestBody<"/api/auth/send-code", "post">;
export type AuthVerifyCodeRequest = RequestBody<"/api/auth/phone/verify", "post">;
export type AuthRegisterRequest = RequestBody<
  "/api/auth/register/phone-password",
  "post"
>;
// AuthLoginRequest - бэкенд использует LocalAuthGuard, поэтому OpenAPI не генерирует requestBody
// Определяем вручную
export type AuthLoginRequest = LoginPhonePasswordDto;
export type AuthRefreshRequest = RequestBody<"/api/auth/refresh", "post">;

// User endpoints
export type UserGetMeResponse = ResponseData<"/api/users/me", "get">;
export type UserUpdateMeRequest = RequestBody<"/api/users/me", "patch">;
export type UserUpdateMeResponse = ResponseData<"/api/users/me", "patch">;
export type UserGetByIdParams = RequestParams<"/api/users/{id}", "get">;
export type UserGetByIdResponse = ResponseData<"/api/users/{id}", "get">;

// Property endpoints
export type ApiPropertyCreateRequest = RequestBody<"/api/properties", "post">;
export type ApiPropertyCreateResponse = ResponseData<"/api/properties", "post", 201>;
// Note: OpenAPI spec has content?: never for PropertiesController_findAll, but API returns PaginatedResponse
export type ApiPropertyListParams = {
  query?: string;
  type?: "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL";
  priceMin?: number;
  priceMax?: number;
  rooms?: number;
  areaMin?: number;
  region?: "CHECHNYA" | "INGUSHETIA" | "OTHER";
  sortBy?: "price-asc" | "price-desc" | "date-desc" | "relevance";
  page?: number;
  limit?: number;
};
export type ApiPropertyListResponse = PaginatedResponse<PropertyResponseDto>; // Using PaginatedResponse since spec doesn't define it
export type ApiPropertySearchParams = OperationParams<"PropertiesController_search">;
export type ApiPropertySearchResponse = ResponseData<"/api/properties/search", "get">;
export type ApiPropertyGetByIdParams = RequestParams<"/api/properties/{id}", "get">;
export type ApiPropertyGetByIdResponse = ResponseData<"/api/properties/{id}", "get">;
export type ApiPropertyUpdateParams = RequestParams<"/api/properties/{id}", "patch">;
export type ApiPropertyUpdateRequest = RequestBody<"/api/properties/{id}", "patch">;
export type ApiPropertyUpdateResponse = ResponseData<"/api/properties/{id}", "patch">;
export type ApiPropertyDeleteParams = RequestParams<"/api/properties/{id}", "delete">;

// Favorites endpoints
export type FavoritesListResponse = ResponseData<"/api/favorites", "get">;
export type FavoritesAddParams = RequestParams<"/api/favorites/{propertyId}", "post">;
export type FavoritesAddResponse = ResponseData<
  "/api/favorites/{propertyId}",
  "post",
  201
>;
export type FavoritesRemoveParams = RequestParams<
  "/api/favorites/{propertyId}",
  "delete"
>;

// Admin endpoints
// Note: OpenAPI spec has content?: never for these endpoints, but API actually returns data
// Using any temporarily until spec is fixed
export type AdminStatisticsResponse = any; // ResponseData<"/api/admin/statistics", "get"> returns void
export type AdminUsersParams = {
  page?: number;
  limit?: number;
  search?: string;
};
export type AdminPropertiesParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ACTIVE" | "PENDING" | "SOLD" | "ARCHIVED";
  type?: "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL";
};
export type AdminUpdateUserRoleParams = {
  id: string;
};
export type AdminUpdateUserRoleRequest = RequestBody<
  "/api/admin/users/{id}/role",
  "patch"
>;
export type AdminUpdatePropertyStatusParams = {
  id: string;
};
export type AdminUpdatePropertyStatusRequest = RequestBody<
  "/api/admin/properties/{id}/status",
  "patch"
>;
export type AdminDeleteUserParams = {
  id: string;
};
export type AdminDeletePropertyParams = {
  id: string;
};

// Upload endpoints (не в OpenAPI spec, определяем вручную)
export type UploadAvatarResponse = {
  avatar: string;
};
export type UploadImagesResponse = {
  images: Array<{
    url: string;
    publicId: string;
  }>;
};
