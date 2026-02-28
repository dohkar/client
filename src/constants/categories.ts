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

export const CATEGORIES_AVITO = [
  {
    label: "Новостройки",
    href: "/ingushetiya/kvartiry/catalog/novostroyki-ASgBAgICA0SSA8YQ5geOUvLFDvCTmgI",
    src: "https://avito.st/static/ims/rre_services_web_nd_light_216x116.png",
    srcSet: [
      "https://avito.st/static/ims/rre_services_web_nd_light_108x58.png 108w",
      "https://avito.st/static/ims/rre_services_web_nd_light_216x116.png 216w",
      "https://avito.st/static/ims/rre_services_web_nd_light_324x174.png 324w",
      "https://avito.st/static/ims/rre_services_web_nd_light_432x232.png 432w",
    ],
  },
  {
    label: "Покупка квартиры",
    href: "/ingushetiya/kvartiry/prodam-ASgBAgICAUSSA8YQ",
    src: "https://avito.st/static/ims/rre_services_web_ss_light_216x116.png",
    srcSet: [
      "https://avito.st/static/ims/rre_services_web_ss_light_108x58.png 108w",
      "https://avito.st/static/ims/rre_services_web_ss_light_216x116.png 216w",
      "https://avito.st/static/ims/rre_services_web_ss_light_324x174.png 324w",
      "https://avito.st/static/ims/rre_services_web_ss_light_432x232.png 432w",
    ],
  },
  {
    label: "Покупка дома",
    href: "/ingushetiya/doma_dachi_kottedzhi/prodam-ASgBAgICAUSUA9AQ",
    src: "https://avito.st/static/ims/rre_services_web_su_light_216x116.png",
    srcSet: [
      "https://avito.st/static/ims/rre_services_web_su_light_108x58.png 108w",
      "https://avito.st/static/ims/rre_services_web_su_light_216x116.png 216w",
      "https://avito.st/static/ims/rre_services_web_su_light_324x174.png 324w",
      "https://avito.st/static/ims/rre_services_web_su_light_432x232.png 432w",
    ],
  },
  {
    label: "Жильё посуточно",
    href: "/ingushetiya/travel",
    src: "https://avito.st/static/ims/rre_services_web_str_light_216x116.png",
    srcSet: [
      "https://avito.st/static/ims/rre_services_web_str_light_108x58.png 108w",
      "https://avito.st/static/ims/rre_services_web_str_light_216x116.png 216w",
      "https://avito.st/static/ims/rre_services_web_str_light_324x174.png 324w",
      "https://avito.st/static/ims/rre_services_web_str_light_432x232.png 432w",
    ],
  },
  {
    label: "Аренда квартиры надолго",
    href: "/ingushetiya/kvartiry/sdam/na_dlitelnyy_srok-ASgBAgICAkSSA8gQ8AeQUg",
    src: "https://avito.st/static/ims/rre_services_web_ltr_light_216x116.png",
    srcSet: [
      "https://avito.st/static/ims/rre_services_web_ltr_light_108x58.png 108w",
      "https://avito.st/static/ims/rre_services_web_ltr_light_216x116.png 216w",
      "https://avito.st/static/ims/rre_services_web_ltr_light_324x174.png 324w",
      "https://avito.st/static/ims/rre_services_web_ltr_light_432x232.png 432w",
    ],
  },
];
