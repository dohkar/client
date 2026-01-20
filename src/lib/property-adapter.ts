import type { Property, PropertyBackend, PropertyStatus } from "@/types/property";

/**
 * Адаптер для преобразования данных недвижимости из формата бэкенда в формат фронтенда
 */
export function adaptProperty(backend: PropertyBackend): Property {
  const regionMap: Record<string, "Chechnya" | "Ingushetia" | "Other"> = {
    CHECHNYA: "Chechnya",
    INGUSHETIA: "Ingushetia",
    OTHER: "Other",
  };

  const typeMap: Record<string, "apartment" | "house" | "land" | "commercial"> =
    {
      APARTMENT: "apartment",
      HOUSE: "house",
      LAND: "land",
      COMMERCIAL: "commercial",
    };

  return {
    id: backend.id,
    title: backend.title,
    price: backend.price,
    currency: backend.currency,
    location: backend.location,
    region: regionMap[backend.region] || "Other",
    type: typeMap[backend.type] || "apartment",
    rooms: backend.rooms,
    area: backend.area,
    image: backend.images?.[0] || "/placeholder.svg",
    images: backend.images || [],
    isPremium: backend.user?.isPremium ?? false,
    datePosted: backend.createdAt,
    description: backend.description,
    features: backend.features || [],
    contact: {
      name: backend.user?.name || "Не указано",
      phone: backend.user?.phone || "Не указано",
    },
    status: (backend.status.toLowerCase() as PropertyStatus) as Property["status"],
    views: backend.views,
    userId: backend.userId,
    createdAt: backend.createdAt,
    updatedAt: backend.updatedAt,
    pricePerMeter:
      backend.area > 0 ? Math.round(backend.price / backend.area) : undefined,
  };
}
