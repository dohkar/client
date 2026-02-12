import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Политика конфиденциальности",
  description:
    "Политика конфиденциальности платформы Дохкар: как мы собираем, используем и защищаем персональные данные пользователей.",
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
