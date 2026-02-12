import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Поиск недвижимости",
  description:
    "Поиск объявлений о продаже и аренде недвижимости на Кавказе. Фильтры по типу, цене, региону, городу, количеству комнат и площади. Квартиры, дома, участки, коммерческая недвижимость.",
  path: "/search",
  keywords: [
    "поиск недвижимости",
    "объявления недвижимость",
    "квартиры",
    "дома",
    "участки",
    "Чечня",
    "Ингушетия",
    "фильтры недвижимости",
  ],
});

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
