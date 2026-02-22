import { Metadata } from "next";
import { cache } from "react";
import { logger } from "@/lib/utils/logger";
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Из сегмента URL извлекает id объявления: /property/[id] или /property/[id-slug] */
function extractPropertyIdFromSegment(segment: string): string {
  const s = segment.trim();
  if (UUID_REGEX.test(s)) return s;
  if (s.length > 36 && s[36] === "-" && UUID_REGEX.test(s.slice(0, 36))) {
    return s.slice(0, 36);
  }
  return s;
}

// Кэшированная функция для получения объявления (используется и в metadata, и в page)
const getProperty = cache(async (id: string) => {
  const propertyId = extractPropertyIdFromSegment(id);
  try {
    const response = await fetch(`${API_URL}/api/properties/${propertyId}`, {
      next: { revalidate: 60 }, // ISR: обновление каждые 60 секунд
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch property");
    }

    const data = await response.json();
    return data.status === "success" ? data.data : null;
  } catch (error) {
    logger.error("Error fetching property:", error);
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(id);

  if (!property) {
    return {
      title: "Объявление не найдено",
      description:
        "Объявление не найдено или было удалено. Перейдите в каталог недвижимости Дохкар, чтобы найти квартиры, дома и участки в Чечне и Ингушетии.",
    };
  }

  const title = `${property.title} - ${property.price.toLocaleString("ru-RU")} ₽`;
  const rawDesc = property.description?.trim() || "";
  const description =
    rawDesc.length > 155
      ? `${rawDesc.slice(0, 152)}...`
      : rawDesc || "Объявление о недвижимости на Дохкар — цены, фото, контакты продавца.";

  const ogImage = property.images?.[0] || property.image || "/og-default.jpg";
  const fullImageUrl = ogImage.startsWith("http") ? ogImage : toAbsoluteUrl(ogImage);
  const pageUrl = toAbsoluteUrl(`/property/${id}`);

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
          alt: property.title,
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
