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
  vehicle: {
    brandId: "",
    model: "",
    year: new Date().getFullYear(),
    mileage: undefined,
    bodyType: "",
    engine: "",
    transmission: "",
  },
  electronics: {
    brandId: "",
    productType: "",
    model: "",
    storage: "",
    condition: "",
  },
};

/**
 * Значения формы из листинга (редактирование).
 */
export function buildListingFormDefaults(listing: Listing): ListingFormData {
  const base = {
    category: listing.category,
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
  };

  if (listing.category === "REAL_ESTATE") {
    const re = listing.realEstate;
    return {
      ...base,
      category: "REAL_ESTATE",
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
      vehicle: EMPTY_LISTING_FORM_DEFAULTS.vehicle,
      electronics: EMPTY_LISTING_FORM_DEFAULTS.electronics,
    };
  }

  if (listing.category === "VEHICLE") {
    const v = listing.vehicle;
    return {
      ...base,
      category: "VEHICLE",
      realEstate: EMPTY_LISTING_FORM_DEFAULTS.realEstate,
      vehicle: v
        ? {
            brandId: v.brandId,
            model: v.model,
            year: v.year,
            mileage: v.mileage ?? undefined,
            bodyType: v.bodyType ?? "",
            engine: v.engine ?? "",
            transmission: v.transmission ?? "",
          }
        : EMPTY_LISTING_FORM_DEFAULTS.vehicle,
      electronics: EMPTY_LISTING_FORM_DEFAULTS.electronics,
    };
  }

  const e = listing.electronics;
  return {
    ...base,
    category: "ELECTRONICS",
    realEstate: EMPTY_LISTING_FORM_DEFAULTS.realEstate,
    vehicle: EMPTY_LISTING_FORM_DEFAULTS.vehicle,
    electronics: e
      ? {
          brandId: e.brandId,
          productType: e.productType,
          model: e.model,
          storage: e.storage ?? "",
          condition: e.condition ?? "",
        }
      : EMPTY_LISTING_FORM_DEFAULTS.electronics,
  };
}
