import { regionsService } from "@/services/regions.service";
import {
  registerRegionMapping,
  REGION_BACKEND_TO_NAME,
  type RegionName,
} from "@/lib/regions";
import { logger } from "@/lib/utils/logger";

type RegionApiItem = { id: string; name: string };

const REGION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FALLBACK_BACKEND_REGIONS = ["CHECHNYA", "INGUSHETIA", "OTHER"] as const;

const regionNameToIdCache = new Map<RegionName, string>();
let cacheInitializedAt: number | null = null;
let pendingInitialization: Promise<void> | null = null;

function isCacheFresh(): boolean {
  return (
    cacheInitializedAt !== null && Date.now() - cacheInitializedAt < REGION_CACHE_TTL_MS
  );
}

function applyRegionsToCache(regions: RegionApiItem[]): void {
  for (const region of regions) {
    const backendName = region.name as keyof typeof REGION_BACKEND_TO_NAME;
    const regionName = REGION_BACKEND_TO_NAME[backendName];
    if (!regionName) continue;
    regionNameToIdCache.set(regionName, region.id);
    registerRegionMapping(region.id, regionName);
  }
}

export function initializeRegionCache(regions: RegionApiItem[]): void {
  if (!regions.length) return;
  applyRegionsToCache(regions);
  cacheInitializedAt = Date.now();
}

export async function ensureRegionCacheInitialized(): Promise<void> {
  if (regionNameToIdCache.size > 0 && isCacheFresh()) {
    return;
  }

  if (pendingInitialization) {
    await pendingInitialization;
    return;
  }

  pendingInitialization = (async () => {
    try {
      const regions = await regionsService.getRegions();
      if (regions.length > 0) {
        applyRegionsToCache(regions);
        cacheInitializedAt = Date.now();
        return;
      }

      logger.warn("Regions API returned empty list, preserving previous cache");
    } catch (error) {
      logger.error("Failed to initialize regions cache from API", error);
    }

    // Fallback: не затираем рабочий кэш пустыми значениями и просто
    // фиксируем стандартные имена регионов для UX-подсказок.
    for (const backendName of FALLBACK_BACKEND_REGIONS) {
      const regionName = REGION_BACKEND_TO_NAME[backendName];
      if (!regionNameToIdCache.has(regionName)) {
        logger.warn(`No cached id for fallback region ${backendName}`);
      }
    }
  })();

  try {
    await pendingInitialization;
  } finally {
    pendingInitialization = null;
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
  cacheInitializedAt = null;
}

/**
 * Проверяет, заполнен ли кэш регионов
 */
export function isRegionCacheInitialized(): boolean {
  return regionNameToIdCache.size > 0;
}
