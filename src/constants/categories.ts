import type { LucideIcon } from "lucide-react";
import { Building2, Home, Zap, Store } from "lucide-react";
import type { PropertyType } from "@/types/property";
import { buildSearchUrl } from "@/lib/url/segments";

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
    href: buildSearchUrl({ region: "ingushetiya", category: "kvartiry", dealType: "prodam" }),
    color: "from-blue-500/10 to-cyan-500/10",
  },
  {
    id: "house",
    name: "Дома",
    description: "Коттеджи, частные дома",
    icon: Home,
    href: buildSearchUrl({ region: "ingushetiya", category: "doma", dealType: "prodam" }),
    color: "from-green-500/10 to-emerald-500/10",
  },
  {
    id: "land",
    name: "Участки",
    description: "Земля для строительства",
    icon: Zap,
    href: buildSearchUrl({ region: "ingushetiya", category: "uchastki", dealType: "prodam" }),
    color: "from-amber-500/10 to-orange-500/10",
  },
  {
    id: "commercial",
    name: "Коммерция",
    description: "Офисы, магазины, салоны красоты",
    icon: Store,
    href: buildSearchUrl({
      region: "ingushetiya",
      category: "kommercheskaya_nedvizhimost",
      dealType: "prodam",
    }),
    color: "from-purple-500/10 to-pink-500/10",
  },
] as const;

// types/avito-category.ts
export interface AvitoCategory {
  id: string;
  label: string;
  description?: string; // Для SEO и доступности
  href: string;
  icon: {
    src: string;
    srcSet: string[];
    alt?: string;
    sizes?: string; // Например: "(max-width: 768px) 108px, 216px"
  };
  meta: {
    priority: number; // Для сортировки (1 - самый важный)
    featured?: boolean; // Показывать в "рекомендованных"
    analyticsId: string; // Для tracking событий
    tags?: string[]; // Для фильтрации (new, popular, etc.)
  };
  query?: Record<string, string | number>; // Параметры для динамического формирования URL
}

// utils/avito-categories.ts
export const CATEGORIES_AVITO: AvitoCategory[] = [
  {
    id: "novostroyki",
    label: "Новостройки",
    description: "Квартиры в строящихся и сданных домах от застройщиков",
    href: buildSearchUrl({ region: "ingushetiya", category: "novostroyki", dealType: "prodam" }),
    icon: {
      src: "https://avito.st/static/ims/rre_services_web_nd_light_216x116.png",
      srcSet: [
        "https://avito.st/static/ims/rre_services_web_nd_light_108x58.png 108w",
        "https://avito.st/static/ims/rre_services_web_nd_light_216x116.png 216w",
        "https://avito.st/static/ims/rre_services_web_nd_light_324x174.png 324w",
        "https://avito.st/static/ims/rre_services_web_nd_light_432x232.png 432w",
      ],
      alt: "Новостройки в Ингушетии",
      sizes: "(max-width: 768px) 108px, 216px",
    },
    meta: {
      priority: 1,
      featured: true,
      analyticsId: "real_estate_new_buildings",
      tags: ["popular", "new"],
    },
  },
  {
    id: "buy-apartment",
    label: "Покупка квартиры",
    description: "Вторичное жильё и новые квартиры от собственников и агентств",
    href: buildSearchUrl({ region: "ingushetiya", category: "kvartiry", dealType: "prodam" }),
    icon: {
      src: "https://avito.st/static/ims/rre_services_web_ss_light_216x116.png",
      srcSet: [
        "https://avito.st/static/ims/rre_services_web_ss_light_108x58.png 108w",
        "https://avito.st/static/ims/rre_services_web_ss_light_216x116.png 216w",
        "https://avito.st/static/ims/rre_services_web_ss_light_324x174.png 324w",
        "https://avito.st/static/ims/rre_services_web_ss_light_432x232.png 432w",
      ],
      alt: "Купить квартиру в Ингушетии",
      sizes: "(max-width: 768px) 108px, 216px",
    },
    meta: {
      priority: 2,
      featured: true,
      analyticsId: "real_estate_buy_apartment",
      tags: ["popular"],
    },
  },
  {
    id: "buy-house",
    label: "Покупка дома",
    description: "Дома, дачи, коттеджи и таунхаусы для постоянного проживания",
    href: buildSearchUrl({ region: "ingushetiya", category: "doma", dealType: "prodam" }),
    icon: {
      src: "https://avito.st/static/ims/rre_services_web_su_light_216x116.png",
      srcSet: [
        "https://avito.st/static/ims/rre_services_web_su_light_108x58.png 108w",
        "https://avito.st/static/ims/rre_services_web_su_light_216x116.png 216w",
        "https://avito.st/static/ims/rre_services_web_su_light_324x174.png 324w",
        "https://avito.st/static/ims/rre_services_web_su_light_432x232.png 432w",
      ],
      alt: "Купить дом в Ингушетии",
      sizes: "(max-width: 768px) 108px, 216px",
    },
    meta: {
      priority: 3,
      featured: true,
      analyticsId: "real_estate_buy_house",
      tags: ["popular"],
    },
  },
  {
    id: "daily-rent",
    label: "Жильё посуточно",
    description: "Квартиры и дома для краткосрочной аренды на отдых или командировку",
    href: buildSearchUrl({
      region: "ingushetiya",
      category: "kvartiry",
      dealType: "posutochno",
    }),
    icon: {
      src: "https://avito.st/static/ims/rre_services_web_str_light_216x116.png",
      srcSet: [
        "https://avito.st/static/ims/rre_services_web_str_light_108x58.png 108w",
        "https://avito.st/static/ims/rre_services_web_str_light_216x116.png 216w",
        "https://avito.st/static/ims/rre_services_web_str_light_324x174.png 324w",
        "https://avito.st/static/ims/rre_services_web_str_light_432x232.png 432w",
      ],
      alt: "Снять жильё посуточно в Ингушетии",
      sizes: "(max-width: 768px) 108px, 216px",
    },
    meta: {
      priority: 4,
      analyticsId: "real_estate_daily_rent",
      tags: ["travel"],
    },
  },
  {
    id: "long-rent-apartment",
    label: "Аренда квартиры надолго",
    description: "Квартиры для долгосрочной аренды от собственников и риелторов",
    href: buildSearchUrl({ region: "ingushetiya", category: "kvartiry", dealType: "sdam" }),
    icon: {
      src: "https://avito.st/static/ims/rre_services_web_ltr_light_216x116.png",
      srcSet: [
        "https://avito.st/static/ims/rre_services_web_ltr_light_108x58.png 108w",
        "https://avito.st/static/ims/rre_services_web_ltr_light_216x116.png 216w",
        "https://avito.st/static/ims/rre_services_web_ltr_light_324x174.png 324w",
        "https://avito.st/static/ims/rre_services_web_ltr_light_432x232.png 432w",
      ],
      alt: "Снять квартиру надолго в Ингушетии",
      sizes: "(max-width: 768px) 108px, 216px",
    },
    meta: {
      priority: 5,
      featured: true,
      analyticsId: "real_estate_long_rent_apartment",
      tags: ["popular"],
    },
  },
  {
    id: "rent-room",
    label: "Аренда комнаты",
    description: "Комнаты в квартирах и общежитиях для долгосрочной аренды",
    href: buildSearchUrl({ region: "ingushetiya", category: "kvartiry", dealType: "sdam" }),
    icon: {
      src: "https://avito.st/static/ims/rre_services_web_ltr_light_216x116.png",
      srcSet: [
        "https://avito.st/static/ims/rre_services_web_ltr_light_108x58.png 108w",
        "https://avito.st/static/ims/rre_services_web_ltr_light_216x116.png 216w",
        "https://avito.st/static/ims/rre_services_web_ltr_light_324x174.png 324w",
        "https://avito.st/static/ims/rre_services_web_ltr_light_432x232.png 432w",
      ],
      alt: "Снять комнату в Ингушетии",
      sizes: "(max-width: 768px) 108px, 216px",
    },
    meta: {
      priority: 6,
      analyticsId: "real_estate_rent_room",
    },
  },
  // === НОВЫЕ КАТЕГОРИИ ===
  {
    id: "commercial",
    label: "Коммерческая недвижимость",
    description: "Офисы, магазины, склады и помещения для бизнеса",
    href: buildSearchUrl({
      region: "ingushetiya",
      category: "kommercheskaya_nedvizhimost",
      dealType: "prodam",
    }),
    icon: {
      src: "https://avito.st/static/ims/rre_services_web_commercial_light_216x116.png",
      srcSet: [
        "https://avito.st/static/ims/rre_services_web_commercial_light_108x58.png 108w",
        "https://avito.st/static/ims/rre_services_web_commercial_light_216x116.png 216w",
        "https://avito.st/static/ims/rre_services_web_commercial_light_324x174.png 324w",
        "https://avito.st/static/ims/rre_services_web_commercial_light_432x232.png 432w",
      ],
      alt: "Коммерческая недвижимость в Ингушетии",
      sizes: "(max-width: 768px) 108px, 216px",
    },
    meta: {
      priority: 7,
      analyticsId: "real_estate_commercial",
      tags: ["business"],
    },
  },
  {
    id: "land",
    label: "Участки и земля",
    description: "Земельные участки под ИЖС, сельхозназначения и коммерцию",
    href: buildSearchUrl({ region: "ingushetiya", category: "uchastki", dealType: "prodam" }),
    icon: {
      src: "https://avito.st/static/ims/rre_services_web_land_light_216x116.png",
      srcSet: [
        "https://avito.st/static/ims/rre_services_web_land_light_108x58.png 108w",
        "https://avito.st/static/ims/rre_services_web_land_light_216x116.png 216w",
        "https://avito.st/static/ims/rre_services_web_land_light_324x174.png 324w",
        "https://avito.st/static/ims/rre_services_web_land_light_432x232.png 432w",
      ],
      alt: "Купить земельный участок в Ингушетии",
      sizes: "(max-width: 768px) 108px, 216px",
    },
    meta: {
      priority: 8,
      analyticsId: "real_estate_land",
    },
  },
  {
    id: "garage",
    label: "Гаражи и машиноместа",
    description: "Гаражи, парковочные места и боксы в собственности",
    href: buildSearchUrl({
      region: "ingushetiya",
      category: "garazhi_i_mashinomesta",
      dealType: "prodam",
    }),
    icon: {
      src: "https://avito.st/static/ims/rre_services_web_garage_light_216x116.png",
      srcSet: [
        "https://avito.st/static/ims/rre_services_web_garage_light_108x58.png 108w",
        "https://avito.st/static/ims/rre_services_web_garage_light_216x116.png 216w",
        "https://avito.st/static/ims/rre_services_web_garage_light_324x174.png 324w",
        "https://avito.st/static/ims/rre_services_web_garage_light_432x232.png 432w",
      ],
      alt: "Купить гараж в Ингушетии",
      sizes: "(max-width: 768px) 108px, 216px",
    },
    meta: {
      priority: 9,
      analyticsId: "real_estate_garage",
    },
  },
];

// utils/category-helpers.ts (опционально)
export const getCategoryBySlug = (slug: string): AvitoCategory | undefined =>
  CATEGORIES_AVITO.find((cat) => cat.id === slug);

export const getFeaturedCategories = (): AvitoCategory[] =>
  CATEGORIES_AVITO.filter((cat) => cat.meta.featured).sort(
    (a, b) => a.meta.priority - b.meta.priority
  );

export const buildCategoryUrl = (
  baseHref: string,
  params?: Record<string, string>
): string => {
  if (!params) return baseHref;
  const searchParams = new URLSearchParams(params);
  return `${baseHref}?${searchParams.toString()}`;
};
