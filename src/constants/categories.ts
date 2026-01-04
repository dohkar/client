import type { LucideIcon } from "lucide-react";
import { Building2, Home, Zap, Store } from "lucide-react";
import type { PropertyType } from "@/types/property";

export interface CategoryConfig {
  id: PropertyType;
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
}

export const CATEGORIES: CategoryConfig[] = [
  {
    id: "apartment",
    name: "Квартиры",
    description: "Студии, однушки, многокомнатные",
    icon: Building2,
    href: "/search?type=apartment",
    color: "from-blue-500/10 to-cyan-500/10",
  },
  {
    id: "house",
    name: "Дома",
    description: "Коттеджи, частные дома",
    icon: Home,
    href: "/search?type=house",
    color: "from-green-500/10 to-emerald-500/10",
  },
  {
    id: "land",
    name: "Участки",
    description: "Земля для строительства",
    icon: Zap,
    href: "/search?type=land",
    color: "from-amber-500/10 to-orange-500/10",
  },
  {
    id: "commercial",
    name: "Коммерция",
    description: "Офисы, магазины, салоны красоты",
    icon: Store,
    href: "/search?type=commercial",
    color: "from-purple-500/10 to-pink-500/10",
  },
] as const;
