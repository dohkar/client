import type { Listing, ListingBackend } from "@/types/listing";
import {
  getRegionNameById,
  registerRegionMapping,
  REGION_BACKEND_TO_NAME,
} from "@/lib/regions";

export function adaptListing(backend: ListingBackend): Listing {
  let regionName: string | null = null;

  if (backend.region && "name" in backend.region && typeof backend.region.name === "string") {
    const region = backend.region;
    const backendName = region.name as keyof typeof REGION_BACKEND_TO_NAME;
    regionName = REGION_BACKEND_TO_NAME[backendName] || region.name;
    if (backend.regionId) {
      registerRegionMapping(backend.regionId, regionName as "Chechnya" | "Ingushetia" | "Other");
    }
  } else if (backend.regionId) {
    regionName = getRegionNameById(backend.regionId);
  }

  const images = backend.images?.length ? backend.images : [];
  const placeholder = "/placeholder.svg";

  let latitude: number | null = null;
  let longitude: number | null = null;
  if (backend.realEstate) {
    latitude = backend.realEstate.latitude ?? null;
    longitude = backend.realEstate.longitude ?? null;
  }

  let cityName: string | null = null;
  if (backend.city && "name" in backend.city && typeof backend.city.name === "string") {
    cityName = backend.city.name;
  }

  return {
    id: backend.id,
    slug: backend.slug,
    title: backend.title,
    price: backend.price,
    currency: backend.currency,
    category: backend.category,
    status: backend.status,
    moderationStatus: backend.moderationStatus,
    dealType: backend.dealType ?? "SALE",
    description: backend.description,
    image: images[0] || placeholder,
    images,
    videos: backend.videos,
    location: backend.location,
    regionId: backend.regionId,
    region: regionName,
    cityId: backend.cityId,
    city: cityName,
    userId: backend.userId,
    contact: {
      name: backend.user?.name || "Не указано",
      phone: backend.user?.phone || "Не указано",
    },
    views: backend.views ?? 0,
    favoritesCount: backend.favoritesCount ?? 0,
    rejectionReason: backend.rejectionReason,
    previewAttributes: backend.previewAttributes ?? [],
    allowPhone: backend.allowPhone,
    allowChat: backend.allowChat,
    promotionTier: backend.promotionTier,
    createdAt: backend.createdAt,
    updatedAt: backend.updatedAt,
    realEstate: backend.realEstate,
    vehicle: backend.vehicle,
    electronics: backend.electronics,
    floor: backend.floor,
    latitude,
    longitude,
  };
}
