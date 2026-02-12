import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Правила использования",
  description:
    "Правила использования платформы Дохкар: требования к объявлениям о недвижимости, модерация контента и ограничения для продавцов и покупателей.",
  path: "/rules",
  keywords: ["правила", "модерация", "требования", "объявления"],
});

export default function RulesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
