/**
 * Справочник регионов: ключ БД (Prisma Region.name) ↔ значение в формах/фильтрах и слаг URL.
 */

export const REGION_REGISTRY = [
  { backend: "MOSCOW", frontend: "Moscow", slug: "moskva", labelRu: "Москва" },
  {
    backend: "SAINT_PETERSBURG",
    frontend: "SaintPetersburg",
    slug: "sankt-peterburg",
    labelRu: "Санкт-Петербург",
  },
  {
    backend: "MOSCOW_OBLAST",
    frontend: "MoscowOblast",
    slug: "moskovskaya-oblast",
    labelRu: "Московская область",
  },
  {
    backend: "LENINGRAD_OBLAST",
    frontend: "LeningradOblast",
    slug: "leningradskaya-oblast",
    labelRu: "Ленинградская область",
  },
  { backend: "DAGESTAN", frontend: "Dagestan", slug: "dagestan", labelRu: "Дагестан" },
  {
    backend: "KRASNODAR_KRAI",
    frontend: "KrasnodarKrai",
    slug: "krasnodarskiy-kray",
    labelRu: "Краснодарский край",
  },
  {
    backend: "ROSTOV_OBLAST",
    frontend: "RostovOblast",
    slug: "rostovskaya-oblast",
    labelRu: "Ростовская область",
  },
  {
    backend: "TATARSTAN",
    frontend: "Tatarstan",
    slug: "tatarstan",
    labelRu: "Татарстан",
  },
  {
    backend: "SVERDLOVSK_OBLAST",
    frontend: "SverdlovskOblast",
    slug: "sverdlovskaya-oblast",
    labelRu: "Свердловская область",
  },
  {
    backend: "NOVOSIBIRSK_OBLAST",
    frontend: "NovosibirskOblast",
    slug: "novosibirskaya-oblast",
    labelRu: "Новосибирская область",
  },
  { backend: "CHECHNYA", frontend: "Chechnya", slug: "chechnya", labelRu: "Чечня" },
  {
    backend: "INGUSHETIA",
    frontend: "Ingushetia",
    slug: "ingushetiya",
    labelRu: "Ингушетия",
  },
  { backend: "OTHER", frontend: "Other", slug: "other", labelRu: "Другие регионы" },
] as const;

export type RegionBackendName = (typeof REGION_REGISTRY)[number]["backend"];
export type RegionName = (typeof REGION_REGISTRY)[number]["frontend"];

export const REGION_NAME_VALUES = REGION_REGISTRY.map((r) => r.frontend) as [
  RegionName,
  ...RegionName[],
];

/**
 * Маппинг названий регионов (frontend -> backend)
 */
export const REGION_NAME_TO_BACKEND: Record<RegionName, RegionBackendName> =
  REGION_REGISTRY.reduce(
    (acc, row) => {
      acc[row.frontend] = row.backend;
      return acc;
    },
    {} as Record<RegionName, RegionBackendName>
  );

/**
 * Маппинг названий регионов (backend -> frontend)
 */
export const REGION_BACKEND_TO_NAME: Record<RegionBackendName, RegionName> =
  REGION_REGISTRY.reduce(
    (acc, row) => {
      acc[row.backend] = row.frontend;
      return acc;
    },
    {} as Record<RegionBackendName, RegionName>
  );

/** Слаг path-поиска → frontend-имя региона */
export const REGION_SLUG_TO_NAME: Record<string, RegionName> = REGION_REGISTRY.reduce(
  (acc, row) => {
    acc[row.slug] = row.frontend;
    return acc;
  },
  {} as Record<string, RegionName>
);

/** Лейблы фильтров: frontend → русский */
export const REGION_FRONTEND_LABELS: Record<RegionName, string> = REGION_REGISTRY.reduce(
  (acc, row) => {
    acc[row.frontend] = row.labelRu;
    return acc;
  },
  {} as Record<RegionName, string>
);

/** Лейблы для админки / API: Region.name (backend) → русский */
export const REGION_BACKEND_LABELS: Record<string, string> = REGION_REGISTRY.reduce(
  (acc, row) => {
    acc[row.backend] = row.labelRu;
    return acc;
  },
  {} as Record<string, string>
);

export function isRegionName(value: string): value is RegionName {
  return value in REGION_NAME_TO_BACKEND;
}

const regionIdCache = new Map<string, RegionName>();

export function registerRegionMapping(regionId: string, regionName: RegionName): void {
  regionIdCache.set(regionId, regionName);
}

export function getRegionNameById(regionId: string): RegionName {
  return regionIdCache.get(regionId) || "Other";
}

export function clearRegionCache(): void {
  regionIdCache.clear();
}

export function getAllRegionMappings(): Map<string, RegionName> {
  return new Map(regionIdCache);
}
