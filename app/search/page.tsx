import { permanentRedirect } from "next/navigation";
import {
  API_DEAL_TO_SLUG,
  API_TYPE_TO_SLUG,
  buildSearchUrl,
  regionSlugFromApi,
} from "@/lib/url/segments";

/** Старые query-значения (?dealType=buy / rent_in / daily) → слаг path. */
const LEGACY_DEAL_TO_SLUG: Record<string, string> = {
  buy: "prodam",
  rent_in: "sdam",
  daily: "posutochno",
};

interface SearchPageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

function pickParam(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) {
    const [first] = value;
    return first;
  }
  return value;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = (await searchParams) ?? {};

  const rawType = pickParam(params.type);
  const rawDealType = pickParam(params.dealType) ?? pickParam(params.deal);
  const rawRegion = pickParam(params.region);
  const isAllRegions = rawRegion === "all";

  const category =
    rawType && API_TYPE_TO_SLUG[rawType.toLowerCase() as keyof typeof API_TYPE_TO_SLUG]
      ? API_TYPE_TO_SLUG[rawType.toLowerCase() as keyof typeof API_TYPE_TO_SLUG]
      : "nedvizhimost";
  const dealSlug = rawDealType
    ? LEGACY_DEAL_TO_SLUG[rawDealType.toLowerCase()] ??
      API_DEAL_TO_SLUG[rawDealType.toUpperCase().replace("-", "_")]
    : undefined;
  const region = isAllRegions ? "all" : rawRegion ? regionSlugFromApi(rawRegion) : "ingushetiya";

  const newUrl = buildSearchUrl({
    region,
    category,
    dealType: dealSlug,
    params: {
      query: pickParam(params.query),
      cityId: pickParam(params.cityId),
      price_min: pickParam(params.price_min) ?? pickParam(params.priceMin),
      price_max: pickParam(params.price_max) ?? pickParam(params.priceMax),
      rooms: pickParam(params.rooms) ?? pickParam(params.roomsMin),
      area_min: pickParam(params.area_min) ?? pickParam(params.areaMin),
      sort: pickParam(params.sort) ?? pickParam(params.sortBy),
      page: pickParam(params.page),
    },
  });

  permanentRedirect(newUrl);
}
