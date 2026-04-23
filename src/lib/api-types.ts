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
export type CreateListingDto = ApiSchemas["CreateListingDto"];
export type ListingResponseDto = ApiSchemas["ListingResponseDto"];
export type UpdateListingDto = ApiSchemas["UpdateListingDto"];
export type FavoriteResponseDto = ApiSchemas["FavoriteResponseDto"];
export type UpdateUserRoleDto = ApiSchemas["UpdateUserRoleDto"];

/** @deprecated Контракт `/api/properties` снят; используйте {@link CreateListingDto} */
export type CreatePropertyDto = CreateListingDto;
/** @deprecated Контракт `/api/properties` снят; используйте {@link ListingResponseDto} */
export type PropertyResponseDto = ListingResponseDto;
/** @deprecated Контракт `/api/properties` снят; используйте {@link UpdateListingDto} */
export type UpdatePropertyDto = UpdateListingDto;

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

/** Ответ GET /api/users/public/:id (не в OpenAPI до пересборки схемы) */
export type PublicUserProfile = {
  id: string;
  name: string | null;
  avatar: string | null;
  isPremium: boolean;
  createdAt: string;
};

// Listings endpoints (`/api/listings`)
export type ApiListingCreateRequest = RequestBody<"/api/listings", "post">;
export type ApiListingCreateResponse = ResponseData<"/api/listings", "post", 201>;
export type ApiListingListParams = RequestParams<"/api/listings", "get">;
export type ApiListingListResponse = PaginatedResponse<ListingResponseDto>;
export type ApiListingSearchParams = OperationParams<"ListingsController_search">;
export type ApiListingSearchResponse = ResponseData<"/api/listings/search", "get">;
export type ApiListingGetByIdParams = RequestParams<"/api/listings/{id}", "get">;
export type ApiListingGetByIdResponse = ResponseData<"/api/listings/{id}", "get">;
export type ApiListingUpdateParams = RequestParams<"/api/listings/{id}", "patch">;
export type ApiListingUpdateRequest = RequestBody<"/api/listings/{id}", "patch">;
export type ApiListingUpdateResponse = ResponseData<"/api/listings/{id}", "patch">;
export type ApiListingDeleteParams = RequestParams<"/api/listings/{id}", "delete">;

/** @deprecated Используйте типы ApiListing* */
export type ApiPropertyCreateRequest = ApiListingCreateRequest;
/** @deprecated Используйте типы ApiListing* */
export type ApiPropertyCreateResponse = ApiListingCreateResponse;
/** @deprecated Используйте типы ApiListing* */
export type ApiPropertyListParams = ApiListingListParams;
/** @deprecated Используйте типы ApiListing* */
export type ApiPropertyListResponse = ApiListingListResponse;
/** @deprecated Используйте типы ApiListing* */
export type ApiPropertySearchParams = ApiListingSearchParams;
/** @deprecated Используйте типы ApiListing* */
export type ApiPropertySearchResponse = ApiListingSearchResponse;
/** @deprecated Используйте типы ApiListing* */
export type ApiPropertyGetByIdParams = ApiListingGetByIdParams;
/** @deprecated Используйте типы ApiListing* */
export type ApiPropertyGetByIdResponse = ApiListingGetByIdResponse;
/** @deprecated Используйте типы ApiListing* */
export type ApiPropertyUpdateParams = ApiListingUpdateParams;
/** @deprecated Используйте типы ApiListing* */
export type ApiPropertyUpdateRequest = ApiListingUpdateRequest;
/** @deprecated Используйте типы ApiListing* */
export type ApiPropertyUpdateResponse = ApiListingUpdateResponse;
/** @deprecated Используйте типы ApiListing* */
export type ApiPropertyDeleteParams = ApiListingDeleteParams;

// Favorites endpoints
export type FavoritesListResponse = ResponseData<"/api/favorites", "get">;
export type FavoritesAddParams = RequestParams<"/api/favorites/{listingId}", "post">;
export type FavoritesAddResponse = ResponseData<
  "/api/favorites/{listingId}",
  "post",
  201
>;
export type FavoritesRemoveParams = RequestParams<"/api/favorites/{listingId}", "delete">;

// Admin endpoints
// Note: OpenAPI spec has content?: never for these endpoints, but API actually returns data
// Using any temporarily until spec is fixed
export type AdminStatisticsResponse = any; // ResponseData<"/api/admin/statistics", "get"> returns void
export type AdminUsersParams = {
  page?: number;
  limit?: number;
  search?: string;
  role?: "USER" | "PREMIUM" | "ADMIN";
  status?: "active" | "banned";
};
export type AdminPropertiesParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ACTIVE" | "PENDING" | "REJECTED" | "SOLD" | "ARCHIVED";
  type?: "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL";
  regionId?: string;
  sortBy?: "date-desc" | "date-asc" | "views-desc";
};
export type AdminUpdatePropertyStatusRequest = {
  status: "ACTIVE" | "PENDING" | "REJECTED" | "SOLD" | "ARCHIVED";
  rejectionReason?: string;
};
export type AdminUpdateUserRoleParams = {
  id: string;
};
export type AdminUpdateUserRoleRequest = {
  role: "USER" | "PREMIUM" | "ADMIN";
};
export type AdminUpdatePropertyStatusParams = {
  id: string;
};
export type AdminDeleteUserParams = {
  id: string;
};
export type AdminDeletePropertyParams = {
  id: string;
};
export type AdminAuditLogsParams = {
  page?: number;
  limit?: number;
  entityType?: string;
  userId?: string;
};
export type AdminChatsParams = {
  page?: number;
  limit?: number;
  type?: "PROPERTY" | "SUPPORT";
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
