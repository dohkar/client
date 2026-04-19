import { ROUTES } from "@/constants";
import { formatPrice } from "@/lib/utils/format";
import type { Listing } from "@/types/listing";
import type { Property } from "@/types/property";
import { viewHistoryStorage } from "./view-history";

export function pushListingToViewHistory(listing: Listing): void {
  viewHistoryStorage.push({
    id: listing.id,
    title: listing.title,
    price: formatPrice(listing.price, listing.currency),
    address: listing.location?.trim() || "Адрес не указан",
    imageUrl: listing.images[0] || listing.image || "/placeholder.svg",
    href: ROUTES.listing(listing.id, listing.slug),
  });
}

export function pushPropertyToViewHistory(property: Property): void {
  viewHistoryStorage.push({
    id: property.id,
    title: property.title,
    price: formatPrice(property.price, property.currency),
    address: property.location?.trim() || "Адрес не указан",
    imageUrl: property.images[0] || property.image || "/placeholder.svg",
    href: ROUTES.property(property.id, property.slug),
  });
}
