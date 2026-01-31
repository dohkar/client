import { Metadata } from "next";
import { getProperty } from "@/lib/server/property";

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

  const keywords = [
    property.type === "apartment" ? "квартира" : property.type === "house" ? "дом" : "участок",
    property.region,
    property.city,
    "недвижимость",
    "купить",
    "продажа",
  ].filter((k): k is string => Boolean(k));

  return {
    title,
    description,
    keywords,
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
