import type { MediaItem } from "@/components/features/property-gallery/types";
import type { Listing } from "@/types/listing";

/**
 * Фото и видео объявления для галереи (единый формат для всех категорий).
 */
export function buildListingMediaItems(listing: Listing): MediaItem[] {
  const items: MediaItem[] = [];
  const seen = new Set<string>();
  const imageSources =
    listing.images?.length > 0 ? listing.images : listing.image ? [listing.image] : [];

  imageSources.forEach((src, i) => {
    const url = src?.trim();
    if (!url || seen.has(url)) return;
    seen.add(url);
    items.push({
      id: `img-${i}-${url.slice(-24)}`,
      type: "image",
      src: url,
      alt: `${listing.title} — фото ${items.length + 1}`,
    });
  });

  listing.videos?.forEach((src, i) => {
    const url = src?.trim();
    if (!url || seen.has(url)) return;
    seen.add(url);
    items.push({
      id: `vid-${i}-${url.slice(-24)}`,
      type: "video",
      src: url,
    });
  });

  if (items.length === 0) {
    items.push({
      id: "placeholder",
      type: "image",
      src: "/placeholder.svg",
      alt: listing.title,
    });
  }

  return items;
}
