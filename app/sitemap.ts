import type { MetadataRoute } from "next";
import { REAL_ESTATE_ONLY_LAUNCH } from "@/constants/config";
import { getSiteUrl } from "@/lib/seo";
import {
  buildSearchUrl,
  CATEGORY_MAP,
  DEAL_TYPE_MAP,
  REGION_MAP,
} from "@/lib/url/segments";

const REAL_ESTATE_SITEMAP_SLUGS = new Set([
  "nedvizhimost",
  "kvartiry",
  "doma",
  "uchastki",
  "kommercheskaya_nedvizhimost",
  "garazhi_i_mashinomesta",
  "novostroyki",
]);

function sitemapCategorySlugs(): string[] {
  const all = Object.keys(CATEGORY_MAP);
  if (!REAL_ESTATE_ONLY_LAUNCH) return all;
  return all.filter((slug) => REAL_ESTATE_SITEMAP_SLUGS.has(slug));
}

/**
 * Генерирует sitemap.xml для поисковых систем.
 * Включает основные публичные страницы. Карточки объявлений можно добавить позже через API.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const searchPages: MetadataRoute.Sitemap = Object.keys(REGION_MAP).flatMap((region) => {
    const categories = sitemapCategorySlugs();
    const categoryEntries = categories.map((category) => ({
      url: `${baseUrl}${buildSearchUrl({ region, category })}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.85,
    }));

    const dealEntries = categories.flatMap((category) =>
      Object.keys(DEAL_TYPE_MAP).map((dealType) => ({
        url: `${baseUrl}${buildSearchUrl({ region, category, dealType })}`,
        lastModified: now,
        changeFrequency: "daily" as const,
        priority: 0.9,
      }))
    );

    return [...categoryEntries, ...dealEntries];
  });

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${baseUrl}/sell`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/premium`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/rules`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  return [...staticPages, ...searchPages];
}
