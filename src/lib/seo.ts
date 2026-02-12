import type { Metadata } from "next";

const SITE_NAME = "Дохкар";

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://dohkar.ru";
}

export function getDefaultOgImage(): string {
  return `${getSiteUrl()}/og-default.jpg`;
}

export function toAbsoluteUrl(path: string): string {
  const base = getSiteUrl().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export interface PageMetaOptions {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
  keywords?: string[];
  noIndex?: boolean;
  type?: "website" | "article";
}

/**
 * Собирает метаданные для страницы: title, description, openGraph, twitter, canonical.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  keywords,
  noIndex = false,
  type = "website",
}: PageMetaOptions): Metadata {
  // const siteUrl = getSiteUrl();
  const url = toAbsoluteUrl(path);
  const ogImage = image?.startsWith("http")
    ? image
    : image
      ? toAbsoluteUrl(image)
      : getDefaultOgImage();

  const meta: Metadata = {
    title,
    description,
    keywords: keywords?.length ? keywords : undefined,
    openGraph: {
      title,
      description,
      type,
      url,
      siteName: SITE_NAME,
      locale: "ru_RU",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: imageAlt ?? title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
  };

  if (noIndex) {
    meta.robots = {
      index: false,
      follow: false,
      noarchive: true,
    };
  }

  return meta;
}

/** Дефолтные метаданные для главной и общие настройки сайта */
export const DEFAULT_SITE_METADATA: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Недвижимость Кавказа — объявления о продаже и аренде | Дохкар",
    template: "%s | Дохкар",
  },
  description:
    "Платформа недвижимости Дохкар: тысячи объявлений о продаже и аренде квартир, домов и участков в Чечне, Ингушетии и на Кавказе. Удобный поиск, безопасные сделки, премиум-размещение.",
  keywords: [
    "недвижимость",
    "объявления недвижимость",
    "продажа квартир",
    "аренда домов",
    "Чечня",
    "Ингушетия",
    "Грозный",
    "Назрань",
    "Кавказ",
    "Дохкар",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ru_RU",
    images: [
      {
        url: getDefaultOgImage(),
        width: 1200,
        height: 630,
        alt: "Дохкар — недвижимость Кавказа",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};
