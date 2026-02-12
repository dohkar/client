import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Политика конфиденциальности",
  description:
    "Политика конфиденциальности Дохкар: как мы собираем, используем, храним и защищаем ваши персональные данные при использовании сервиса недвижимости.",
  path: "/privacy",
  keywords: ["конфиденциальность", "персональные данные", "защита данных"],
});

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
