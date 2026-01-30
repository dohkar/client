import { Metadata } from "next";
import { cache } from "react";
import { logger } from "@/lib/utils/logger";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Кэшированная функция для получения объявления (используется и в metadata, и в page)
const getProperty = cache(async (id: string) => {
  try {
    const response = await fetch(`${API_URL}/api/properties/${id}`, {
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
      title: "Объявление не найдено | Dohkar",
      description: "Объявление не найдено или удалено",
    };
  }

  const title = `${property.title} - ${property.price.toLocaleString("ru-RU")} ₽ | Dohkar`;
  const description =
    property.description.length > 160
      ? `${property.description.slice(0, 157)}...`
      : property.description;

  // Первое изображение для og:image
  const ogImage = property.images?.[0] || property.image || "/og-default.jpg";

  // Формируем полный URL для og:image
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://dohkar.ru";
  const fullImageUrl = ogImage.startsWith("http") ? ogImage : `${siteUrl}${ogImage}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${siteUrl}/property/${id}`,
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: property.title,
        },
      ],
      siteName: "Dohkar",
      locale: "ru_RU",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [fullImageUrl],
    },
    alternates: {
      canonical: `${siteUrl}/property/${id}`,
    },
  };
}

export default function PropertyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
