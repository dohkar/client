import { Metadata } from "next";
import { cache } from "react";
import { logger } from "@/lib/utils/logger";
import { toAbsoluteUrl } from "@/lib/seo";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractListingIdFromSegment(segment: string): string {
  const s = segment.trim();
  if (UUID_REGEX.test(s)) return s;
  if (s.length > 36 && s[36] === "-" && UUID_REGEX.test(s.slice(0, 36))) {
    return s.slice(0, 36);
  }
  return s;
}

interface ListingMetaPayload {
  title: string;
  description?: string | null;
  price: number;
  images?: string[];
  image?: string | null;
}

const getListingForMeta = cache(
  async (segment: string): Promise<ListingMetaPayload | null> => {
    const listingId = extractListingIdFromSegment(segment);
    try {
      const response = await fetch(`${API_URL}/api/listings/${listingId}`, {
        next: { revalidate: 60 },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error("Failed to fetch listing");
      }

      const json: unknown = await response.json();
      if (
        typeof json === "object" &&
        json !== null &&
        "status" in json &&
        (json as { status: string }).status === "success" &&
        "data" in json &&
        typeof (json as { data: unknown }).data === "object" &&
        (json as { data: ListingMetaPayload }).data !== null
      ) {
        return (json as { data: ListingMetaPayload }).data;
      }
      return null;
    } catch (error) {
      logger.error("Error fetching listing for legacy /property metadata:", error);
      return null;
    }
  }
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListingForMeta(id);

  if (!listing) {
    return {
      title: "Объявление не найдено",
      description: "Объявление не найдено или было удалено. Перейдите в каталог Дохкар.",
    };
  }

  const title = `${listing.title} — ${listing.price.toLocaleString("ru-RU")} ₽`;
  const rawDesc = listing.description?.trim() ?? "";
  const description =
    rawDesc.length > 155
      ? `${rawDesc.slice(0, 152)}...`
      : rawDesc || "Объявление на Дохкар.";

  const ogImage = listing.images?.[0] ?? listing.image ?? "/og-default.jpg";
  const fullImageUrl = ogImage.startsWith("http") ? ogImage : toAbsoluteUrl(ogImage);
  const canonicalPath = `/listing/${id}`;
  const pageUrl = toAbsoluteUrl(canonicalPath);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: pageUrl,
      siteName: "Дохкар",
      locale: "ru_RU",
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: listing.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [fullImageUrl],
    },
    alternates: {
      canonical: pageUrl,
    },
  };
}

export default function PropertyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
