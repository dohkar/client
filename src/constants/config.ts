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
 * Запуск только недвижимости: скрыть выбор категории в подаче, не смешивать выдачу с авто/техникой,
 * редирект URL /transport и /elektronika → /nedvizhimost. API и админка без изменений.
 * Включить: NEXT_PUBLIC_REAL_ESTATE_ONLY_LAUNCH=true
 */
export const REAL_ESTATE_ONLY_LAUNCH =
  process.env.NEXT_PUBLIC_REAL_ESTATE_ONLY_LAUNCH === "true";

/**
 * Лимиты пагинации
 * propertiesMaxLimit должен совпадать с server MAX_PAGE_LIMIT (GET /api/properties).
 */
export const PAGINATION = {
  defaultLimit: 10,
  maxLimit: 100,
  /** Максимум записей на страницу для GET /api/properties (сервер ограничивает ответ этим числом). */
  propertiesMaxLimit: 50,
} as const;

/**
 * Время кэширования (в секундах)
 */
export const CACHE_TIME = {
  short: 60,
  medium: 300,
  long: 3600,
} as const;
