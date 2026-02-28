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
  /** Переопределение Open Graph (сливается с дефолтами) */
  openGraph?: Metadata["openGraph"];
  /** Переопределение Twitter (сливается с дефолтами) */
  twitter?: Metadata["twitter"];
  /** Переопределение alternates (например canonical) */
  alternates?: Metadata["alternates"];
}

/**
 * Собирает метаданные для страницы: title, description, openGraph, twitter, canonical.
 * Переданные openGraph/twitter/alternates сливаются с дефолтами.
 */
export function buildPageMetadata(options: PageMetaOptions): Metadata {
  const {
    title,
    description,
    path,
    image,
    imageAlt,
    keywords,
    noIndex = false,
    type = "website",
    openGraph: openGraphOverride,
    twitter: twitterOverride,
    alternates: alternatesOverride,
  } = options;

  const url = toAbsoluteUrl(path);
  const ogImage = image?.startsWith("http")
    ? image
    : image
      ? toAbsoluteUrl(image)
      : getDefaultOgImage();

  const defaultOpenGraph: Metadata["openGraph"] = {
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
  };

  const defaultTwitter: Metadata["twitter"] = {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  };

  const meta: Metadata = {
    title,
    description,
    keywords: keywords?.length ? keywords : undefined,
    openGraph: openGraphOverride
      ? { ...defaultOpenGraph, ...openGraphOverride }
      : defaultOpenGraph,
    twitter: twitterOverride ? { ...defaultTwitter, ...twitterOverride } : defaultTwitter,
    alternates: alternatesOverride ?? { canonical: url },
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

/** Описание главной страницы: уникальное, 150–160 символов для вывода в поиске */
export const HOME_DESCRIPTION =
  "Платформа недвижимости Дохкар: объявления о продаже и аренде квартир, домов и участков в Чечне, Ингушетии и на Кавказе. Удобный поиск, безопасные сделки.";

/** Дефолтные метаданные для главной и общие настройки сайта */
export const DEFAULT_SITE_METADATA: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Недвижимость Кавказа — объявления о продаже и аренде",
    template: "%s · Дохкар",
  },
  description: HOME_DESCRIPTION,
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
    title: "Недвижимость Кавказа — объявления о продаже и аренде",
    description: HOME_DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
    locale: "ru_RU",
    url: getSiteUrl(),
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
    title: "Недвижимость Кавказа — объявления о продаже и аренде",
    description: HOME_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};
