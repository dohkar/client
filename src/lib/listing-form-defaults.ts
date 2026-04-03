import type { Listing } from "@/types/listing";
import type { ListingFormData } from "@/components/features/listing-form/schema";

/** Начальные значения формы создания объявления (без загрузки с сервера). */
export const EMPTY_LISTING_FORM_DEFAULTS: ListingFormData = {
  category: "REAL_ESTATE",
  dealType: "SALE",
  price: 0,
  description: "",
  location: "",
  regionId: "",
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
 * Заполняет форму редактирования из модели Listing (после GET /api/listings/:id).
 */
export function buildListingFormDefaults(listing: Listing): ListingFormData {
  const realEstateBlock =
    listing.category === "REAL_ESTATE" && listing.realEstate
      ? {
          type: listing.realEstate.type,
          rooms: listing.realEstate.rooms ?? undefined,
          area: Math.max(1, listing.realEstate.area),
          features: listing.realEstate.features ?? [],
          latitude: listing.realEstate.latitude ?? undefined,
          longitude: listing.realEstate.longitude ?? undefined,
        }
      : EMPTY_LISTING_FORM_DEFAULTS.realEstate!;

  const vehicleBlock =
    listing.category === "VEHICLE" && listing.vehicle
      ? {
          brandId: listing.vehicle.brandId,
          model: listing.vehicle.model,
          year: listing.vehicle.year,
          mileage: listing.vehicle.mileage ?? undefined,
          bodyType: listing.vehicle.bodyType ?? "",
          engine: listing.vehicle.engine ?? "",
          transmission: listing.vehicle.transmission ?? "",
        }
      : EMPTY_LISTING_FORM_DEFAULTS.vehicle!;

  const electronicsBlock =
    listing.category === "ELECTRONICS" && listing.electronics
      ? {
          brandId: listing.electronics.brandId,
          productType: listing.electronics.productType,
          model: listing.electronics.model,
          storage: listing.electronics.storage ?? "",
          condition: listing.electronics.condition ?? "",
        }
      : EMPTY_LISTING_FORM_DEFAULTS.electronics!;

  return {
    category: listing.category,
    title: listing.title,
    dealType: listing.dealType,
    price: listing.price,
    location: listing.location ?? "",
    regionId: listing.regionId ?? "",
    cityId: listing.cityId ?? "",
    street: listing.street ?? "",
    house: listing.house ?? "",
    floor: listing.floor ?? null,
    description: listing.description,
    realEstate: realEstateBlock,
    vehicle: vehicleBlock,
    electronics: electronicsBlock,
  };
}
