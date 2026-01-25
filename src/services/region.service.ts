/**
 * Сервис для работы с регионами
 *
 * Временное решение: используем кэш для маппинга regionId -> название
 * В будущем должен быть endpoint /api/regions для получения списка регионов
 */

import { apiClient } from "@/lib/api-client";
import {
  registerRegionMapping,
  getRegionNameById,
  REGION_NAME_TO_BACKEND,
  REGION_BACKEND_TO_NAME,
  type RegionName
} from "@/lib/regions";
import type { PropertyBackend } from "@/types/property";

/**
 * Кэш для маппинга названия региона -> regionId
 * Заполняется при первом запросе списка недвижимости
 */
const regionNameToIdCache = new Map<RegionName, string>();

/**
 * Инициализирует кэш регионов на основе данных недвижимости
 * Вызывается при первом запросе списка недвижимости
 */
export function initializeRegionCache(properties: PropertyBackend[]): void {
  for (const property of properties) {
    // Type guard: проверяем, что region имеет правильную структуру (не Record<string, never>)
    if (property.region && "name" in property.region && "id" in property.region && 
        typeof property.region.name === "string" && typeof property.region.id === "string") {
      // Конвертируем backend название (CHECHNYA) в frontend название (Chechnya)
      const region = property.region as { id: string; name: string };
      const backendName = region.name as "CHECHNYA" | "INGUSHETIA" | "OTHER";
      const regionName = REGION_BACKEND_TO_NAME[backendName] || "Other";

      // Кэшируем оба направления
      regionNameToIdCache.set(regionName, region.id);
      registerRegionMapping(region.id, regionName);
    }
  }
}

/**
 * Получает regionId по названию региона
 * Если кэш не заполнен, возвращает undefined
 */
export function getRegionIdByName(regionName: RegionName): string | undefined {
  return regionNameToIdCache.get(regionName);
}

/**
 * Получает все зарегистрированные маппинги
 */
export function getAllRegionMappings(): Map<RegionName, string> {
  return new Map(regionNameToIdCache);
}

/**
 * Очищает кэш регионов
 */
export function clearRegionCache(): void {
  regionNameToIdCache.clear();
}

/**
 * Проверяет, заполнен ли кэш регионов
 */
export function isRegionCacheInitialized(): boolean {
  return regionNameToIdCache.size > 0;
}
