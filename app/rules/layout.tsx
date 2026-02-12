import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Правила использования",
  description:
    "Правила и требования для пользователей платформы Дохкар: допустимый контент объявлений, модерация и ограничения.",
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
