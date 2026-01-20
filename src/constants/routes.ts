/**
 * Маршруты приложения
 */
export const ROUTES = {
  home: "/",
  about: "/about",
  contact: "/contact",
  // Auth
  login: "/auth/login",
  register: "/auth/register",
  // Property
  search: "/search",
  property: (id: string) => `/property/${id}`,
  sell: "/sell",
  // User
  dashboard: "/dashboard",
  favorites: "/favorites",
  profile: (id: string) => `/profile/${id}`,
  messages: "/messages",
  // Other
  help: "/help",
  premium: "/premium",
  privacy: "/privacy",
  terms: "/terms",
  rules: "/rules",
} as const;

/**
 * API эндпоинты
 */
export const API_ENDPOINTS = {
  // Health
  health: "/api/health",

  // Auth
  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    logout: "/api/auth/logout",
    refresh: "/api/auth/refresh",
    me: "/api/auth/me",
    google: "/api/auth/google",
    googleCallback: "/api/auth/google/callback",
    yandex: "/api/auth/yandex",
    yandexCallback: "/api/auth/yandex/callback",
    vk: "/api/auth/vk",
    vkCallback: "/api/auth/vk/callback",
  },

  // Users
  users: {
    me: "/api/users/me",
    updateMe: "/api/users/me",
    getById: (id: string) => `/api/users/${id}`,
  },

  // Properties
  properties: {
    list: "/api/properties",
    search: "/api/properties/search",
    getById: (id: string) => `/api/properties/${id}`,
    create: "/api/properties",
    update: (id: string) => `/api/properties/${id}`,
    delete: (id: string) => `/api/properties/${id}`,
    categoryStats: "/api/properties/stats/categories",
  },

  // Favorites
  favorites: {
    list: "/api/favorites",
    add: (propertyId: string) => `/api/favorites/${propertyId}`,
    remove: (propertyId: string) => `/api/favorites/${propertyId}`,
  },
  // Admin
  admin: {
    statistics: "/api/admin/statistics",
    users: "/api/admin/users",
    properties: "/api/admin/properties",
    updateUserRole: (id: string) => `/api/admin/users/${id}/role`,
    updatePropertyStatus: (id: string) => `/api/admin/properties/${id}/status`,
    deleteUser: (id: string) => `/api/admin/users/${id}`,
    deleteProperty: (id: string) => `/api/admin/properties/${id}`,
  },

  // Upload
  upload: {
    avatar: "/api/upload/avatar",
    images: "/api/upload/images",
  },
} as const;
