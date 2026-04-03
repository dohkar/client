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
  search: "/search",
  /**
   * Алиас на канонический URL листинга (старый код может вызывать ROUTES.property).
   */
  property: (id: string, slug?: string) =>
    slug ? `/listing/${id}-${slug}` : `/listing/${id}`,
  /** Канонический URL объявления: id или id-slug */
  listing: (id: string, slug?: string) =>
    slug ? `/listing/${id}-${slug}` : `/listing/${id}`,
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

  // Listings (multi-category)
  listings: {
    list: "/api/listings",
    search: "/api/listings/search",
    getById: (id: string) => `/api/listings/${id}`,
    getRelated: (id: string) => `/api/listings/${id}/related`,
    getLimits: "/api/listings/limits",
    create: "/api/listings",
    update: (id: string) => `/api/listings/${id}`,
    delete: (id: string) => `/api/listings/${id}`,
    categoryStats: "/api/listings/stats/categories",
  },

  // Brands
  brands: {
    list: "/api/brands",
    getById: (id: string) => `/api/brands/${id}`,
  },

  // Analytics
  analytics: {
    recordView: (listingId: string) => `/api/analytics/listings/${listingId}/view`,
    recordContact: (listingId: string) => `/api/analytics/listings/${listingId}/contact`,
    viewStats: (listingId: string) => `/api/analytics/listings/${listingId}/views`,
    contactStats: (listingId: string) => `/api/analytics/listings/${listingId}/contacts`,
    priceHistory: (listingId: string) =>
      `/api/analytics/listings/${listingId}/price-history`,
    sellerStats: (userId: string) => `/api/analytics/sellers/${userId}/stats`,
  },

  // Favorites
  favorites: {
    list: "/api/favorites",
    /** listingId — единственный контракт избранного */
    add: (listingId: string) => `/api/favorites/${listingId}`,
    remove: (listingId: string) => `/api/favorites/${listingId}`,
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
    listings: "/api/admin/listings",
    approveListing: (id: string) => `/api/admin/listings/${id}/approve`,
    rejectListing: (id: string) => `/api/admin/listings/${id}/reject`,
    deleteListing: (id: string) => `/api/admin/listings/${id}`,
    auditLogs: "/api/admin/audit-logs",
    chats: "/api/admin/chats",
    closeChat: (id: string) => `/api/admin/chats/${id}/close`,
  },

  // Upload
  upload: {
    avatar: "/api/upload/avatar",
    images: "/api/upload/images",
    videos: "/api/upload/videos",
  },

  // Subscriptions
  subscriptions: {
    plans: "/api/subscriptions/plans",
    createPayment: "/api/subscriptions/create-payment",
    paymentStatus: (paymentId: string) =>
      `/api/subscriptions/payments/${paymentId}/status`,
  },

  // Chats
  chats: {
    list: "/api/chats",
    createListing: "/api/chats/listing",
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
