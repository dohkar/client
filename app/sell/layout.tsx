import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Разместить объявление",
  description:
    "Разместите объявление о недвижимости на Дохкар: квартиры, дома, участки в Чечне и Ингушетии. Первое объявление бесплатно. Премиум-продвижение от 500₽/месяц. Быстрая модерация.",
  path: "/sell",
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
});

export default function SellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
