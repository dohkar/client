export type PropertyType = "apartment" | "house" | "land" | "commercial";
export type PropertyStatus = "active" | "pending" | "sold" | "archived";

// Backend property format
export interface PropertyBackend {
  id: string;
  title: string;
  price: number;
  currency: "RUB" | "USD";
  location: string;
  region: "CHECHNYA" | "INGUSHETIA" | "OTHER";
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
