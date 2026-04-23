import type { Listing, ListingBackend } from "@/types/listing";
import {
  getRegionNameById,
  registerRegionMapping,
  REGION_BACKEND_TO_NAME,
} from "@/lib/regions";

/**
 * Минимальный объект листинга из ответа API избранного (без полных связей region, city, realEstate).
 */
export type FavoriteListingBackend = Partial<ListingBackend> &
  Pick<
    ListingBackend,
    | "id"
    | "slug"
    | "title"
    | "price"
    | "currency"
    | "category"
    | "status"
    | "moderationStatus"
    | "dealType"
    | "description"
    | "createdAt"
    | "updatedAt"
  >;

/**
 * Адаптирует листинг из ответа getFavorites (может быть без полных связей) в тип Listing для карточки.
 */
export function adaptFavoriteListing(raw: FavoriteListingBackend): Listing {
  const images = Array.isArray(raw.images) ? raw.images : [];
  const placeholder = "/placeholder.svg";
  return adaptListing({
    ...raw,
    images: images.length ? images : [placeholder],
    region: raw.region ?? null,
    city: raw.city ?? null,
    realEstate: raw.realEstate ?? null,
    user: raw.user ?? undefined,
    regionId: raw.regionId ?? null,
    cityId: raw.cityId ?? null,
    location: raw.location ?? null,
    videos: raw.videos,
    userId: raw.userId ?? "",
    views: raw.views ?? 0,
    favoritesCount: raw.favoritesCount ?? 0,
    rejectionReason: raw.rejectionReason,
    archivedAt: raw.archivedAt,
    previewAttributes: Array.isArray(raw.previewAttributes) ? raw.previewAttributes : [],
    allowPhone: raw.allowPhone ?? true,
    allowChat: raw.allowChat ?? true,
    promotionTier: raw.promotionTier ?? "NONE",
    floor: raw.floor,
  } as ListingBackend);
}

export function adaptListing(backend: ListingBackend): Listing {
  let regionName: string | null = null;

  if (
    backend.region &&
    "name" in backend.region &&
    typeof backend.region.name === "string"
  ) {
    const region = backend.region;
    const backendName = region.name as keyof typeof REGION_BACKEND_TO_NAME;
    regionName = REGION_BACKEND_TO_NAME[backendName] || region.name;
    if (backend.regionId) {
      registerRegionMapping(
        backend.regionId,
        regionName as "Chechnya" | "Ingushetia" | "Other"
      );
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
    street: backend.street ?? null,
    house: backend.house ?? null,
    regionId: backend.regionId,
    region: regionName,
    cityId: backend.cityId,
    city: cityName,
    userId: backend.userId,
    contact: {
      name: backend.user?.name || "Не указано",
      phone: backend.user?.phone || "Не указано",
    },
    sellerCreatedAt:
      backend.user && "createdAt" in backend.user
        ? (backend.user.createdAt as string)
        : null,
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
    floor: backend.floor,
    latitude,
    longitude,
  };
}
