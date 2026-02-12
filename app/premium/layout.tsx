import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Премиум размещение",
  description:
    "Премиум-размещение объявлений на Дохкар: приоритет в поиске, больше просмотров, выделение в списке, быстрая модерация. От 500₽/месяц.",
  path: "/premium",
  keywords: [
    "премиум",
    "продвижение объявлений",
    "топ объявлений",
    "размещение недвижимости",
  ],
});

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
