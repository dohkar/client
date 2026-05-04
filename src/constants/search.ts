import { DealType } from "@/types/common";
import { Home, Key, Calendar } from "lucide-react";

export interface PopularCity {
  label: string;
  slug: string;
  /** Сегмент региона в URL каталога (см. REGION_MAP). */
  region: string;
}

export const POPULAR_CITIES: PopularCity[] = [
  { label: "Москва", slug: "moskva", region: "moskva" },
  { label: "Санкт-Петербург", slug: "sankt-peterburg", region: "sankt-peterburg" },
  { label: "Краснодар", slug: "krasnodar", region: "krasnodarskiy-kray" },
  { label: "Махачкала", slug: "makhachkala", region: "dagestan" },
  { label: "Казань", slug: "kazan", region: "tatarstan" },
  { label: "Екатеринбург", slug: "ekaterinburg", region: "sverdlovskaya-oblast" },
  { label: "Новосибирск", slug: "novosibirsk", region: "novosibirskaya-oblast" },
  { label: "Ростов-на-Дону", slug: "rostov-na-donu", region: "rostovskaya-oblast" },
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
