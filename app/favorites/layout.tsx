import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: "Избранное",
  description:
    "Ваши избранные объявления о недвижимости. Сохраняйте понравившиеся варианты и сравнивайте предложения на Дохкар.",
  path: "/favorites",
  noIndex: true,
});

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
