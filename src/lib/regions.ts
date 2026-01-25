/**
 * Утилиты для работы с регионами
 * 
 * Поскольку API возвращает только regionId (UUID), а UI использует человекочитаемые названия,
 * мы создаем маппинг и кэш для преобразования между форматами.
 */

export type RegionName = "Chechnya" | "Ingushetia" | "Other";
export type RegionBackendName = "CHECHNYA" | "INGUSHETIA" | "OTHER";

/**
 * Маппинг названий регионов (frontend -> backend)
 */
export const REGION_NAME_TO_BACKEND: Record<RegionName, RegionBackendName> = {
  Chechnya: "CHECHNYA",
  Ingushetia: "INGUSHETIA",
  Other: "OTHER",
};

/**
 * Маппинг названий регионов (backend -> frontend)
 */
export const REGION_BACKEND_TO_NAME: Record<RegionBackendName, RegionName> = {
  CHECHNYA: "Chechnya",
  INGUSHETIA: "Ingushetia",
  OTHER: "Other",
};

/**
 * Кэш для маппинга regionId -> название региона
 * Заполняется динамически при получении данных с API
 */
const regionIdCache = new Map<string, RegionName>();

/**
 * Регистрирует маппинг regionId -> название региона
 * Используется для кэширования данных, полученных с API
 */
export function registerRegionMapping(regionId: string, regionName: RegionName): void {
  regionIdCache.set(regionId, regionName);
}

/**
 * Получает название региона по regionId
 * Если маппинг не найден в кэше, возвращает "Other" по умолчанию
 */
export function getRegionNameById(regionId: string): RegionName {
  return regionIdCache.get(regionId) || "Other";
}

/**
 * Очищает кэш регионов
 */
export function clearRegionCache(): void {
  regionIdCache.clear();
}

/**
 * Получает все зарегистрированные маппинги
 */
export function getAllRegionMappings(): Map<string, RegionName> {
  return new Map(regionIdCache);
}
