import type { Property, PropertyBackend, PropertyStatus } from "@/types/property";
import {
  getRegionNameById,
  registerRegionMapping,
  REGION_BACKEND_TO_NAME,
  type RegionName
} from "@/lib/regions";

/**
 * Адаптер для преобразования данных недвижимости из формата бэкенда в формат фронтенда
 */
export function adaptProperty(backend: PropertyBackend): Property {
  const typeMap: Record<string, "apartment" | "house" | "land" | "commercial"> =
    {
      APARTMENT: "apartment",
      HOUSE: "house",
      LAND: "land",
      COMMERCIAL: "commercial",
    };

  // Определяем название региона:
  // 1. Если есть relation с region, используем его
  // 2. Иначе используем кэш по regionId
  // 3. Иначе используем "Other" по умолчанию
  let regionName: RegionName = "Other";

  // Type guard: проверяем, что region имеет правильную структуру (не Record<string, never>)
  if (backend.region && "name" in backend.region && typeof backend.region.name === "string") {
    // Если API вернул relation с регионом, используем его
    const region = backend.region as { id: string; name: string };
    const backendName = region.name as keyof typeof REGION_BACKEND_TO_NAME;
    regionName = REGION_BACKEND_TO_NAME[backendName] || "Other";
    // Кэшируем маппинг для будущего использования
    registerRegionMapping(backend.regionId, regionName);
  } else {
    // Используем кэш или значение по умолчанию
    regionName = getRegionNameById(backend.regionId);
  }

  const images = backend.images?.length ? backend.images : [];
  const videos = backend.videos?.length ? backend.videos : [];
  const placeholder = "/placeholder.svg";

  return {
    id: backend.id,
    slug: backend.slug ?? backend.id,
    title: backend.title,
    price: backend.price,
    currency: backend.currency,
    location: backend.location,
    region: regionName,
    type: typeMap[backend.type] || "apartment",
    dealType: backend.dealType ?? "SALE",
    rooms: backend.rooms,
    area: backend.area,
    image: images[0] || placeholder,
    images,
    videos,
    isPremium: backend.user?.isPremium ?? false,
    datePosted: backend.createdAt,
    description: backend.description,
    features: backend.features || [],
    contact: {
      name: backend.user?.name || "Не указано",
      phone: backend.user?.phone || "Не указано",
    },
    status: (backend.status.toLowerCase() as PropertyStatus) as Property["status"],
    views: backend.views ?? 0,
    favoritesCount: backend.favoritesCount ?? 0,
    userId: backend.userId,
    createdAt: backend.createdAt,
    updatedAt: backend.updatedAt,
    rejectionReason: backend.rejectionReason ?? undefined,
    pricePerMeter:
      backend.area > 0 ? Math.round(backend.price / backend.area) : undefined,
    latitude: backend.latitude,
    longitude: backend.longitude,
    cityId: backend.cityId ?? undefined,
    city:
      backend.city && "name" in backend.city && typeof (backend.city as { name: string }).name === "string"
        ? (backend.city as { name: string }).name
        : undefined,
    floor: backend.floor ?? undefined,
  };
}
