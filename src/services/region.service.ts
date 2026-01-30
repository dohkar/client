/**
 * Сервис для работы с регионами
 *
 * Временное решение: используем кэш для маппинга regionId -> название
 * В будущем должен быть endpoint /api/regions для получения списка регионов
 */

import { apiClient } from "@/lib/api-client";
import { API_ENDPOINTS } from "@/constants/routes";
import {
  registerRegionMapping,
  getRegionNameById,
  REGION_NAME_TO_BACKEND,
  REGION_BACKEND_TO_NAME,
  type RegionName
} from "@/lib/regions";
import type { PropertyBackend } from "@/types/property";
import type { PaginatedResponse } from "@/types";

/**
 * Кэш для маппинга названия региона -> regionId
 * Заполняется при первом запросе списка недвижимости
 */
const regionNameToIdCache = new Map<RegionName, string>();

/**
 * Флаг для отслеживания процесса инициализации
 */
let isInitializing = false;

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
 * Предварительно инициализирует кэш регионов, запрашивая список недвижимости
 * Используется для заполнения кэша перед созданием объявления
 */
export async function ensureRegionCacheInitialized(): Promise<void> {
  // Если кэш уже заполнен, ничего не делаем
  if (regionNameToIdCache.size > 0) {
    return;
  }

  // Если уже идет инициализация, ждем её завершения
  if (isInitializing) {
    // Ждем до 5 секунд, пока кэш не заполнится
    let attempts = 0;
    while (isInitializing && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      if (regionNameToIdCache.size > 0) {
        return;
      }
    }
    return;
  }

  try {
    isInitializing = true;
    
    // Запрашиваем список недвижимости с минимальными параметрами для получения регионов
    const response = await apiClient.get<PaginatedResponse<PropertyBackend>>(
      `${API_ENDPOINTS.properties.list}?limit=10`
    );
    
    // Инициализируем кэш на основе полученных данных
    if (response.data && response.data.length > 0) {
      initializeRegionCache(response.data);
    }
  } catch (error) {
    console.error("Ошибка при инициализации кэша регионов:", error);
    // Не пробрасываем ошибку, чтобы не блокировать работу формы
  } finally {
    isInitializing = false;
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
