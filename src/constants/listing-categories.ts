import type { LucideIcon } from "lucide-react";
import { Building2, Car, Smartphone } from "lucide-react";
import type { ListingCategory } from "@/types/listing";

export interface ListingCategoryConfig {
  id: ListingCategory;
  name: string;
  description: string;
  icon: LucideIcon;
  slug: string;
  color: string;
  previewFields: string[];
}

export const LISTING_CATEGORIES: ListingCategoryConfig[] = [
  {
    id: "REAL_ESTATE",
    name: "Недвижимость",
    description: "Квартиры, дома, участки, коммерция",
    icon: Building2,
    slug: "nedvizhimost",
    color: "from-blue-500/10 to-cyan-500/10",
    previewFields: ["rooms", "area"],
  },
  {
    id: "VEHICLE",
    name: "Транспорт",
    description: "Легковые, мото, грузовики",
    icon: Car,
    slug: "transport",
    color: "from-green-500/10 to-emerald-500/10",
    previewFields: ["year", "mileage"],
  },
  {
    id: "ELECTRONICS",
    name: "Электроника",
    description: "Телефоны, планшеты, ноутбуки",
    icon: Smartphone,
    slug: "elektronika",
    color: "from-purple-500/10 to-pink-500/10",
    previewFields: ["productType", "storage"],
  },
];

export const LISTING_CATEGORY_MAP: Record<string, ListingCategoryConfig> =
  Object.fromEntries(LISTING_CATEGORIES.map((c) => [c.id, c]));

export const LISTING_CATEGORY_SLUG_MAP: Record<string, ListingCategoryConfig> =
  Object.fromEntries(LISTING_CATEGORIES.map((c) => [c.slug, c]));

export function getCategoryConfig(category: ListingCategory): ListingCategoryConfig {
  return LISTING_CATEGORY_MAP[category] ?? LISTING_CATEGORIES[0];
}
