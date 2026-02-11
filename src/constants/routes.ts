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
  /** URL объявления: id или id-slug для SEO */
  property: (id: string, slug?: string) =>
    slug ? `/property/${id}-${slug}` : `/property/${id}`,
  sell: "/sell",
  // User
  dashboard: "/dashboard",
  dashboardSettings: "/dashboard/settings",
  dashboardSupport: "/dashboard/support",
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

  // Regions & Cities
  regions: {
    list: "/api/regions",
    getById: (id: string) => `/api/regions/${id}`,
  },
  cities: {
    list: "/api/cities",
  },

  // Properties
  properties: {
    list: "/api/properties",
    search: "/api/properties/search",
    getById: (id: string) => `/api/properties/${id}`,
    getRelated: (id: string) => `/api/properties/${id}/related`,
    getLimits: "/api/properties/limits",
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
    getUserById: (id: string) => `/api/admin/users/${id}`,
    banUser: (id: string) => `/api/admin/users/${id}/ban`,
    unbanUser: (id: string) => `/api/admin/users/${id}/unban`,
    updateUserRole: (id: string) => `/api/admin/users/${id}/role`,
    deleteUser: (id: string) => `/api/admin/users/${id}`,
    properties: "/api/admin/properties",
    updatePropertyStatus: (id: string) => `/api/admin/properties/${id}/status`,
    deleteProperty: (id: string) => `/api/admin/properties/${id}`,
    auditLogs: "/api/admin/audit-logs",
    chats: "/api/admin/chats",
    closeChat: (id: string) => `/api/admin/chats/${id}/close`,
  },

  // Upload
  upload: {
    avatar: "/api/upload/avatar",
    images: "/api/upload/images",
  },

  // Chats
  chats: {
    list: "/api/chats",
    createProperty: "/api/chats/property",
    createSupport: "/api/chats/support",
    messages: (chatId: string) => `/api/chats/${chatId}/messages`,
    sendMessage: (chatId: string) => `/api/chats/${chatId}/messages`,
    markRead: (chatId: string) => `/api/chats/${chatId}/read`,
  },

  // Inbox (CONTACT + COMPLAINT)
  inbox: {
    create: "/api/inbox",
    list: "/api/inbox",
    getById: (id: string) => `/api/inbox/${id}`,
    updateStatus: (id: string) => `/api/inbox/${id}/status`,
  },
} as const;
