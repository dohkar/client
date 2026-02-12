import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "О проекте",
  description:
    "Дохкар — платформа для поиска и продажи недвижимости на Кавказе. Тысячи объявлений, удобный поиск, безопасные сделки, премиум-размещение и поддержка 24/7.",
  path: "/about",
  keywords: ["Дохкар", "о проекте", "недвижимость Кавказ", "платформа недвижимости"],
});

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
