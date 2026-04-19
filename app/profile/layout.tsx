import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Профиль пользователя",
  description: "Объявления и публичная информация продавца на Дохкар.",
  path: "/profile",
});

export default function ProfileSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
