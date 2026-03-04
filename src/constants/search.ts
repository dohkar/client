import { DealType } from "@/types/common";
import { Home, Key, Calendar } from "lucide-react";

export interface PopularCity {
  label: string;
  slug: string;
  region: "ingushetiya" | "chechnya";
}

export const POPULAR_CITIES: PopularCity[] = [
  { label: "Грозный", slug: "groznyy", region: "chechnya" },
  { label: "Назрань", slug: "nazran", region: "ingushetiya" },
  { label: "Магас", slug: "magas", region: "ingushetiya" },
  { label: "Гудермес", slug: "gudermes", region: "chechnya" },
];

export const DEAL_TYPES: IDealType[] = [
  { value: "buy", label: "Купить", icon: Home },
  { value: "rent", label: "Снять", icon: Key },
  { value: "daily", label: "Посуточно", icon: Calendar },
];

interface IDealType {
  value: DealType;
  label: string;
  icon: React.ElementType;
}
