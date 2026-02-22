export type PropertyType = "apartment" | "house" | "land" | "commercial";
export type PropertyStatus = "active" | "pending" | "rejected" | "sold" | "archived";

/** Тип сделки в API (бэкенд) */
export type PropertyDealType = "SALE" | "BUY" | "RENT_OUT" | "RENT_IN" | "EXCHANGE";

/** Регион (субъект РФ) с бэкенда */
export interface RegionDto {
  id: string;
  name: string;
}

/** Город с бэкенда */
export interface CityDto {
  id: string;
  name: string;
  slug?: string | null;
  regionId: string;
  region?: { id: string; name: string };
}

// Backend property format (matches API response; price in rubles)
export interface PropertyBackend {
  id: string;
  slug?: string;
  title: string;
  price: number;
  currency: "RUB" | "USD";
  location: string;
  regionId: string;
  type: "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL";
  dealType?: PropertyDealType;
  cityId?: string | null;
  city?:
    | { id: string; name: string; slug?: string | null }
    | Record<string, never>
    | null;
  rooms?: number;
  area: number;
  description: string;
  images: string[];
  videos?: string[];
  features: string[];
  status: "ACTIVE" | "PENDING" | "REJECTED" | "SOLD" | "ARCHIVED";
  views: number;
  favoritesCount?: number;
  userId: string;
  archivedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    phone?: string;
    avatar?: string;
    isPremium?: boolean;
  };
  region?: { id: string; name: string } | Record<string, never>;
  latitude?: number;
  longitude?: number;
  floor?: number | null;
  street?: string | null;
  house?: string | null;
}

// Frontend property format (for compatibility)
export interface Property {
  id: string;
  slug: string;
  title: string;
  price: number;
  currency: "RUB" | "USD";
  location: string;
  region: "Chechnya" | "Ingushetia" | "Other";
  type: PropertyType;
  dealType: PropertyDealType;
  rooms?: number;
  area: number;
  image: string;
  images: string[];
  videos?: string[];
  isPremium: boolean;
  datePosted: string;
  description: string;
  features: string[];
  contact: { name: string; phone: string };
  status: PropertyStatus;
  views: number;
  favoritesCount: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string | null;
  pricePerMeter?: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  condition?: string;
  city?: string | null;
  cityId?: string | null;
  latitude?: number;
  longitude?: number;
}

export interface PropertyFilters {
  type: PropertyType | "all";
  priceMin: number | null;
  priceMax: number | null;
  roomsMin: number | null;
  areaMin: number | null;
  region: "Chechnya" | "Ingushetia" | "Other" | "all";
  cityId?: string | null;
  sortBy: "price-asc" | "price-desc" | "date-desc" | "relevance";
}

export interface PropertySearchParams {
  query?: string;
  my?: boolean;
  type?: PropertyType;
  dealType?: PropertyDealType;
  priceMin?: number;
  priceMax?: number;
  rooms?: number;
  areaMin?: number;
  floorMin?: number;
  floorMax?: number;
  floorNotFirst?: boolean;
  region?: "Chechnya" | "Ingushetia" | "Other";
  regionId?: string;
  cityId?: string;
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
