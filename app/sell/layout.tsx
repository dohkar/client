import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Разместить объявление о недвижимости | Dohkar",
  description:
    "Разместите объявление о недвижимости на платформе Dohkar. Быстро, удобно, эффективно. Первое объявление бесплатно. Премиум-продвижение от 500₽/месяц.",
  keywords: [
    "разместить объявление",
    "недвижимость",
    "продажа недвижимости",
    "Чечня",
    "Ингушетия",
    "Грозный",
    "Назрань",
    "квартиры",
    "дома",
    "участки",
  ],
  openGraph: {
    title: "Разместить объявление о недвижимости | Dohkar",
    description:
      "Разместите объявление о недвижимости на платформе Dohkar. Быстро, удобно, эффективно.",
    type: "website",
    url: "https://dohkar.ru/sell",
  },
  twitter: {
    card: "summary_large_image",
    title: "Разместить объявление о недвижимости | Dohkar",
    description:
      "Разместите объявление о недвижимости на платформе Dohkar. Быстро, удобно, эффективно.",
  },
  alternates: {
    canonical: "https://dohkar.ru/sell",
  },
};

export default function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
