import type { Listing } from "@/types/listing";
import type { ListingFormData } from "./schema";
import { getRegionNameById } from "@/lib/regions";

function listingRegionToForm(listing: Listing): ListingFormData["region"] {
  if (
    listing.region === "Chechnya" ||
    listing.region === "Ingushetia" ||
    listing.region === "Other"
  ) {
    return listing.region;
  }
  if (listing.regionId) {
    return getRegionNameById(listing.regionId);
  }
  return "Other";
}

export const EMPTY_LISTING_FORM_DEFAULTS: ListingFormData = {
  title: "",
  category: "REAL_ESTATE",
  dealType: "SALE",
  price: 0,
  description: "",
  location: "",
  region: "Other",
  cityId: "",
  street: "",
  house: "",
  floor: null,
  realEstate: { type: "APARTMENT", area: 1, features: [] },
};

/**
 * Значения формы из листинга (редактирование). Только REAL_ESTATE; иначе — пустые defaults.
 */
export function buildListingFormDefaults(listing: Listing): ListingFormData {
  if (listing.category !== "REAL_ESTATE") {
    return {
      ...EMPTY_LISTING_FORM_DEFAULTS,
      title: listing.title,
      description: listing.description,
      dealType: listing.dealType,
      price: listing.price,
      location: listing.location ?? "",
    };
  }

  const re = listing.realEstate;
  return {
    category: "REAL_ESTATE",
    title: listing.title,
    dealType: listing.dealType,
    price: listing.price,
    description: listing.description,
    location: listing.location ?? "",
    region: listingRegionToForm(listing),
    cityId: listing.cityId ?? "",
    street: listing.street ?? "",
    house: listing.house ?? "",
    floor: listing.floor ?? null,
    realEstate: re
      ? {
          type: re.type,
          rooms: re.rooms ?? undefined,
          area: re.area,
          features: re.features ?? [],
          latitude: re.latitude ?? undefined,
          longitude: re.longitude ?? undefined,
        }
      : { type: "APARTMENT", area: 1, features: [] },
  };
}
