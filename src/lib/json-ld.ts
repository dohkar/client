/**
 * Утилиты для генерации JSON-LD структурированных данных для SEO
 */

import type { Property } from "@/types/property";

/**
 * Генерирует JSON-LD для объявления недвижимости
 * @see https://schema.org/RealEstateListing
 */
export function generatePropertyJsonLd(property: Property) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://dohkar.ru";
  
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description,
    url: `${baseUrl}/property/${property.id}`,
    image: property.images || [property.image],
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: property.currency,
      availability: "https://schema.org/InStock",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: property.city,
      addressRegion: property.region,
      addressCountry: "RU",
    },
    ...(property.latitude &&
      property.longitude && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: property.latitude,
          longitude: property.longitude,
        },
      }),
    floorSize: {
      "@type": "QuantitativeValue",
      value: property.area,
      unitCode: "MTK", // квадратный метр
    },
    ...(property.rooms && {
      numberOfRooms: property.rooms,
    }),
    datePosted: property.createdAt ? new Date(property.createdAt).toISOString() : undefined,
    ...(property.updatedAt && {
      dateModified: new Date(property.updatedAt).toISOString(),
    }),
  };
}

/**
 * Генерирует JSON-LD для страницы поиска (ItemList)
 * @see https://schema.org/ItemList
 */
export function generateSearchJsonLd(properties: Property[], page: number = 1) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://dohkar.ru";

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Объявления недвижимости",
    description: "Список объявлений о продаже недвижимости",
    url: `${baseUrl}/search?page=${page}`,
    numberOfItems: properties.length,
    itemListElement: properties.map((property, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "RealEstateListing",
        name: property.title,
        url: `${baseUrl}/property/${property.id}`,
        image: property.image,
        offers: {
          "@type": "Offer",
          price: property.price,
          priceCurrency: property.currency,
        },
      },
    })),
  };
}

/**
 * Генерирует JSON-LD для организации (для root layout)
 * @see https://schema.org/Organization
 */
export function generateOrganizationJsonLd() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "https://dohkar.ru";

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Dohkar",
    description: "Маркетплейс недвижимости в Чечне и Ингушетии",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    sameAs: [
      // Добавить социальные сети когда будут
    ],
  };
}
