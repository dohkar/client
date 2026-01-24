import { Building, Sparkles, Home, Zap, Snowflake, Building2, Car, School, ShoppingBag, UtensilsCrossed, Shield, Wifi, Droplets, Mountain, Waves, TreePine } from "lucide-react";

// Популярные удобства с категориями и иконками
export interface FeatureOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "comfort" | "infrastructure" | "safety" | "utilities" | "location";
}

export const FEATURE_OPTIONS: FeatureOption[] = [
  // Комфорт
  { id: "balcony", label: "Балкон", icon: Building, category: "comfort" },
  { id: "loggia", label: "Лоджия", icon: Building, category: "comfort" },
  { id: "euro_repair", label: "Евроремонт", icon: Sparkles, category: "comfort" },
  { id: "furniture", label: "Мебель", icon: Home, category: "comfort" },
  { id: "appliances", label: "Техника", icon: Zap, category: "comfort" },
  { id: "air_conditioning", label: "Кондиционер", icon: Snowflake, category: "comfort" },
  { id: "elevator", label: "Лифт", icon: Building2, category: "comfort" },

  // Инфраструктура
  { id: "parking", label: "Парковка", icon: Car, category: "infrastructure" },
  { id: "garage", label: "Гараж", icon: Car, category: "infrastructure" },
  { id: "school", label: "Школа рядом", icon: School, category: "infrastructure" },
  { id: "shop", label: "Магазины рядом", icon: ShoppingBag, category: "infrastructure" },
  { id: "restaurant", label: "Кафе/Рестораны", icon: UtensilsCrossed, category: "infrastructure" },

  // Безопасность
  { id: "security", label: "Охрана", icon: Shield, category: "safety" },
  { id: "intercom", label: "Домофон", icon: Shield, category: "safety" },

  // Коммуникации
  { id: "internet", label: "Интернет", icon: Wifi, category: "utilities" },
  { id: "gas", label: "Газ", icon: Zap, category: "utilities" },
  { id: "water", label: "Вода", icon: Droplets, category: "utilities" },
  { id: "electricity", label: "Свет", icon: Zap, category: "utilities" },

  // Расположение
  { id: "mountain_view", label: "Вид на горы", icon: Mountain, category: "location" },
  { id: "river", label: "Рядом река", icon: Waves, category: "location" },
  { id: "garden", label: "Сад", icon: TreePine, category: "location" },
  { id: "basement", label: "Подвал", icon: Building, category: "location" },
  { id: "new_building", label: "Новостройка", icon: Building2, category: "location" },
  { id: "izhs", label: "ИЖС", icon: Home, category: "location" },
];

export const FEATURE_CATEGORIES = {
  comfort: "Комфорт",
  infrastructure: "Инфраструктура",
  safety: "Безопасность",
  utilities: "Коммуникации",
  location: "Расположение",
} as const;