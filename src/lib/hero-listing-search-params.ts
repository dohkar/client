import type { ListingCategory, ListingSearchParams } from "@/types/listing";
import type { PropertyDealType, PropertyType } from "@/types/property";
import type { RegionName } from "@/lib/regions";
import { REGION_MAP } from "@/lib/url/segments";

/** Таб героя → значение сделки как в UI сегментов (вкл. DAILY для посуточно). */
export type HeroDealApiToken = PropertyDealType | "DAILY";

const PROPERTY_TYPE_TO_LISTING_API: Record<
  PropertyType,
  ListingSearchParams["propertyType"]
> = {
  apartment: "APARTMENT",
  house: "HOUSE",
  land: "LAND",
  commercial: "COMMERCIAL",
};

function regionSlugToName(regionSlug: string): RegionName | undefined {
  const entry = REGION_MAP[regionSlug as keyof typeof REGION_MAP];
  const v = entry?.apiValue;
  if (v === "Ingushetia" || v === "Chechnya" || v === "Other") return v;
  return undefined;
}

function heroDealToListingDeal(token: HeroDealApiToken): PropertyDealType {
  return token === "DAILY" ? "RENT_OUT" : token;
}

export interface BuildHeroListingSearchParamsInput {
  dealToken: HeroDealApiToken;
  query: string;
  propertyType: "all" | PropertyType;
  roomsMin: number | null;
  priceMin: number | null;
  priceMax: number | null;
  /** REAL_ESTATE для каталога недвижимости */
  listingCategory: ListingCategory;
  regionId?: string;
}

/**
 * Параметры Listings API для героя — в том же духе, что toListingSearchParams со страницы поиска.
 */
export function buildHeroListingSearchParams(
  input: BuildHeroListingSearchParamsInput
): ListingSearchParams {
  const {
    dealToken,
    query,
    propertyType,
    roomsMin,
    priceMin,
    priceMax,
    listingCategory,
    regionId,
  } = input;

  const params: ListingSearchParams = {
    category: listingCategory,
    dealType: heroDealToListingDeal(dealToken),
    page: 1,
    limit: 1,
    sortBy: "relevance",
  };

  const q = query.trim();
  if (q.length > 0) params.query = q;

  if (propertyType !== "all") {
    params.propertyType = PROPERTY_TYPE_TO_LISTING_API[propertyType];
  }

  if (roomsMin != null) params.rooms = roomsMin;
  if (priceMin != null) params.priceMin = priceMin;
  if (priceMax != null) params.priceMax = priceMax;

  if (regionId) {
    params.regionId = regionId;
  }

  return params;
}

export function getHeroRegionNameForId(regionSlug: string): RegionName | undefined {
  return regionSlugToName(regionSlug);
}
