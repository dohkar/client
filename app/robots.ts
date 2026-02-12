import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

/**
 * Генерирует robots.txt для поисковых роботов.
 * Доступны: главная, поиск, карточки объявлений, статические страницы.
 * Закрыты от индекса: личный кабинет, авторизация, избранное, сообщения.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/auth",
          "/favorites",
          "/messages",
          "/api",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
