/**
 * Конфигурация приложения
 */
export const APP_CONFIG = {
  name: "Дохкар",
  description:
    "Платформа недвижимости: объявления о продаже и аренде квартир, домов и участков на Кавказе. Чечня, Ингушетия, Грозный, Назрань.",
  version: "1.0.0",
} as const;

/**
 * URL API
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/**
 * Лимиты пагинации
 */
export const PAGINATION = {
  defaultLimit: 10,
  maxLimit: 100,
} as const;

/**
 * Время кэширования (в секундах)
 */
export const CACHE_TIME = {
  short: 60,
  medium: 300,
  long: 3600,
} as const;
