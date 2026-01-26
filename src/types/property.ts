export type PropertyType = "apartment" | "house" | "land" | "commercial";
export type PropertyStatus = "active" | "pending" | "sold" | "archived";

// Backend property format (matches API response)
export interface PropertyBackend {
  id: string;
  title: string;
  price: number;
  currency: "RUB" | "USD";
  location: string;
  regionId: string; // Changed from region enum to regionId UUID
  type: "APARTMENT" | "HOUSE" | "LAND" | "COMMERCIAL";
  rooms?: number;
  area: number;
  description: string;
  images: string[];
  features: string[];
  status: "ACTIVE" | "PENDING" | "SOLD" | "ARCHIVED"; // OpenAPI uses uppercase
  views: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    phone?: string;
    avatar?: string;
    isPremium?: boolean;
  };
  // Optional: region relation might be included in some responses
  // OpenAPI spec generates Record<string, never> but API may return proper structure
  region?: {
    id: string;
    name: string;
  } | Record<string, never>;
  // Coordinates for map display
  latitude?: number;
  longitude?: number;
}

// Frontend property format (for compatibility)
export interface Property {
  id: string;
  title: string;
  price: number;
  currency: "RUB" | "USD";
  location: string;
  region: "Chechnya" | "Ingushetia" | "Other";
  type: PropertyType;
  rooms?: number;
  area: number;
  image: string; // First image from images array
  images: string[];
  isPremium: boolean; // Based on user.isPremium
  datePosted: string; // createdAt
  description: string;
  features: string[];
  contact: {
    name: string;
    phone: string;
  };
  status: PropertyStatus;
  views: number;
  userId: string; // ID владельца
  createdAt: string;
  updatedAt: string;
  // Additional computed fields
  pricePerMeter?: number;
  floor?: string;
  totalFloors?: number;
  yearBuilt?: number;
  condition?: string;
  // Coordinates for map display
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
  sortBy: "price-asc" | "price-desc" | "date-desc" | "relevance";
}

export interface PropertySearchParams {
  query?: string;
  type?: PropertyType;
  priceMin?: number;
  priceMax?: number;
  rooms?: number;
  areaMin?: number;
  region?: "Chechnya" | "Ingushetia" | "Other";
  sortBy?: "price-asc" | "price-desc" | "date-desc" | "relevance";
  page?: number;
  limit?: number;
}
