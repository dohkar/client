import type { PropertyType, PropertyDealType, RegionDto, CityDto } from "./property";

export type ListingCategory = "REAL_ESTATE";
export type ListingStatus = "ACTIVE" | "SOLD" | "ARCHIVED";
export type ModerationStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
export type PromotionTier = "NONE" | "ELIGIBLE" | "BOOSTED";
export type SellerType = "PRIVATE" | "BUSINESS";

export interface RealEstateDetails {
  type: "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL";
  rooms?: number | null;
  area: number;
  features: string[];
  latitude?: number | null;
  longitude?: number | null;
}

export interface ListingBackend {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: "RUB";
  category: ListingCategory;
  status: ListingStatus;
  moderationStatus: ModerationStatus;
  dealType: PropertyDealType;
  description: string;
  images: string[];
  videos?: string[];
  location?: string | null;
  street?: string | null;
  house?: string | null;
  floor?: number | null;
  regionId?: string | null;
  region?: { id: string; name: string } | null;
  cityId?: string | null;
  city?: { id: string; name: string; slug?: string | null } | null;
  userId: string;
  user?: {
    id: string;
    name: string | null;
    phone: string | null;
    createdAt?: string;
  };
  views: number;
  favoritesCount: number;
  rejectionReason?: string | null;
  archivedAt?: string | null;
  previewAttributes: string[];
  allowPhone: boolean;
  allowChat: boolean;
  promotionTier: PromotionTier;
  createdAt: string;
  updatedAt: string;
  realEstate?: RealEstateDetails | null;
}

export interface Listing {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: "RUB";
  category: ListingCategory;
  status: ListingStatus;
  moderationStatus: ModerationStatus;
  dealType: PropertyDealType;
  description: string;
  image: string;
  images: string[];
  videos?: string[];
  location?: string | null;
  street?: string | null;
  house?: string | null;
  regionId?: string | null;
  region?: string | null;
  cityId?: string | null;
  city?: string | null;
  userId: string;
  contact: { name: string; phone: string };
  /** Дата регистрации продавца (для блока «на Dohkar с YYYY») */
  sellerCreatedAt?: string | null;
  views: number;
  favoritesCount: number;
  rejectionReason?: string | null;
  previewAttributes: string[];
  allowPhone: boolean;
  allowChat: boolean;
  promotionTier: PromotionTier;
  createdAt: string;
  updatedAt: string;
  realEstate?: RealEstateDetails | null;
  floor?: number | null;
  latitude?: number | null;
  longitude?: number | null;
}

/** Значение query `propertyType` для Listings API (как в Prisma PropertyType). */
export type ListingPropertyTypeParam = "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL";

/** Сегмент списка «Мои объявления» (query `cabinetTab`, только с `my: true`). */
export type MyListingsCabinetTab = "active" | "moderation" | "rejected" | "archive";

export interface ListingSearchParams {
  query?: string;
  my?: boolean;
  /** Сегмент кабинета: активные / модерация / отклонённые / архив */
  cabinetTab?: MyListingsCabinetTab;
  /** Публичные объявления продавца (ACTIVE + APPROVED) */
  sellerId?: string;
  category?: ListingCategory;
  dealType?: PropertyDealType;
  priceMin?: number;
  priceMax?: number;
  regionId?: string;
  cityId?: string;
  propertyType?: ListingPropertyTypeParam;
  rooms?: number;
  areaMin?: number;
  floorMin?: number;
  floorMax?: number;
  floorNotFirst?: boolean;
  /** Только новостройки (бэкенд: realEstate.features содержит «Новостройка») */
  newBuilding?: boolean;
  sortBy?:
    | "price-asc"
    | "price-desc"
    | "date-desc"
    | "relevance"
    | "area-asc"
    | "area-desc";
  page?: number;
  limit?: number;
}

export type { PropertyType, PropertyDealType, RegionDto, CityDto };
